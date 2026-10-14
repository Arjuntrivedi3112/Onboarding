/**
 * Keeps the local progress store (src/lib/progress.ts) and the learner's
 * account in step.
 *
 *   start → flush anything queued offline → pull the server copy → adopt the
 *   merge (src/lib/sync/merge.ts) → from then on, diff every local change
 *   into a persisted, coalescing write queue that flushes shortly after.
 *
 * Lessons never know this exists: they keep calling markComplete() and
 * friends exactly as before.
 */
import type { Json } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import {
  clearLegacyProgress,
  getSnapshot,
  readLegacyProgress,
  replaceProgress,
  subscribe,
  type ProgressState,
} from "@/lib/progress";
import { diffProgress, hasProgress, mergeProgress, opKey, type RemoteProgress, type SyncOp } from "@/lib/sync/merge";
import { track } from "@/lib/telemetry";

const FLUSH_DELAY_MS = 1500;
const MAX_BACKOFF_MS = 60_000;

export type SyncStatus = "idle" | "syncing" | "offline" | "error";

type Listener = (status: SyncStatus) => void;
const statusListeners = new Set<Listener>();
let currentStatus: SyncStatus = "idle";

function setStatus(status: SyncStatus) {
  currentStatus = status;
  statusListeners.forEach((fn) => fn(status));
}

export function getSyncStatus() {
  return currentStatus;
}

export function onSyncStatus(fn: Listener) {
  statusListeners.add(fn);
  return () => statusListeners.delete(fn);
}

function queueKey(userId: string) {
  return `adtech-sync-queue:${userId}`;
}

function loadQueue(userId: string): Map<string, SyncOp> {
  try {
    const raw = localStorage.getItem(queueKey(userId));
    const ops = raw ? (JSON.parse(raw) as SyncOp[]) : [];
    return new Map(ops.map((op) => [opKey(op), op]));
  } catch {
    return new Map();
  }
}

function saveQueue(userId: string, queue: Map<string, SyncOp>) {
  try {
    if (queue.size === 0) localStorage.removeItem(queueKey(userId));
    else localStorage.setItem(queueKey(userId), JSON.stringify([...queue.values()]));
  } catch {
    // In-memory queue still works for this session.
  }
}

async function pushOps(userId: string, ops: SyncOp[]): Promise<boolean> {
  const now = new Date().toISOString();
  const lessons = ops.filter((op): op is Extract<SyncOp, { kind: "lesson" }> => op.kind === "lesson");
  const bookmarksOn = ops.filter((op): op is Extract<SyncOp, { kind: "bookmark" }> => op.kind === "bookmark" && op.on);
  const bookmarksOff = ops.filter((op): op is Extract<SyncOp, { kind: "bookmark" }> => op.kind === "bookmark" && !op.on);
  const profile = ops.find((op): op is Extract<SyncOp, { kind: "profile" }> => op.kind === "profile");

  if (lessons.length > 0) {
    // Every row carries the same columns, so the upsert never touches
    // time_spent_seconds / max_scroll_pct (owned by the reading heartbeat).
    const { error } = await supabase.from("lesson_progress").upsert(
      lessons.map((op) => ({
        user_id: userId,
        lesson_id: op.lessonId,
        first_visited_at: op.firstVisitedAt,
        completed_at: op.completedAt,
        updated_at: now,
      })),
      { onConflict: "user_id,lesson_id" }
    );
    if (error) return false;
  }
  if (bookmarksOn.length > 0) {
    const { error } = await supabase
      .from("bookmarks")
      .upsert(
        bookmarksOn.map((op) => ({ user_id: userId, lesson_id: op.lessonId, created_at: op.at })),
        { onConflict: "user_id,lesson_id" }
      );
    if (error) return false;
  }
  if (bookmarksOff.length > 0) {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", userId)
      .in(
        "lesson_id",
        bookmarksOff.map((op) => op.lessonId)
      );
    if (error) return false;
  }
  if (profile) {
    const { error } = await supabase
      .from("profiles")
      .update({ resume: profile.resume as unknown as Json, started_at: profile.startedAt })
      .eq("id", userId);
    if (error) return false;
  }
  return true;
}

async function pullRemote(userId: string): Promise<RemoteProgress | null> {
  const [lessons, bookmarks, profile] = await Promise.all([
    supabase.from("lesson_progress").select("lesson_id, first_visited_at, completed_at").eq("user_id", userId),
    supabase.from("bookmarks").select("lesson_id, created_at").eq("user_id", userId),
    supabase.from("profiles").select("resume, started_at").eq("id", userId).maybeSingle(),
  ]);
  if (lessons.error || bookmarks.error || profile.error) return null;
  return {
    lessons: lessons.data ?? [],
    bookmarks: bookmarks.data ?? [],
    resume: (profile.data?.resume as unknown as RemoteProgress["resume"]) ?? null,
    started_at: profile.data?.started_at ?? null,
  };
}

/** Emits learning events for the meaningful parts of a local change. */
function trackChanges(ops: SyncOp[], prev: ProgressState) {
  for (const op of ops) {
    if (op.kind === "lesson") {
      const wasComplete = Boolean(prev.completed[op.lessonId]);
      if (op.completedAt && !wasComplete) track("lesson_complete", { lessonId: op.lessonId });
      if (!op.completedAt && wasComplete) track("lesson_uncomplete", { lessonId: op.lessonId });
    } else if (op.kind === "bookmark" && op.on) {
      track("bookmark", { lessonId: op.lessonId });
    }
  }
}

/**
 * Start syncing for one account. Returns a stop function. The local store
 * must already be scoped to this account (AuthProvider does that).
 */
export function startProgressSync(userId: string): () => Promise<void> {
  let stopped = false;
  let ready = false;
  let prev: ProgressState = getSnapshot();
  const queue = loadQueue(userId);
  let timer: ReturnType<typeof setTimeout> | null = null;
  let backoff = 2000;
  let flushing: Promise<boolean> | null = null;

  const flush = async (): Promise<boolean> => {
    if (flushing) return flushing;
    if (queue.size === 0) return true;
    flushing = (async () => {
      setStatus("syncing");
      const ops = [...queue.values()];
      const ok = await pushOps(userId, ops).catch(() => false);
      if (stopped) return ok;
      if (ok) {
        // Only drop what was sent; anything queued meanwhile stays.
        ops.forEach((op) => {
          if (queue.get(opKey(op)) === op) queue.delete(opKey(op));
        });
        saveQueue(userId, queue);
        backoff = 2000;
        setStatus("idle");
        if (queue.size > 0) schedule();
      } else {
        setStatus(navigator.onLine === false ? "offline" : "error");
        schedule(backoff);
        backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
      }
      return ok;
    })();
    const result = await flushing;
    flushing = null;
    return result;
  };

  const schedule = (delay = FLUSH_DELAY_MS) => {
    if (stopped) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void flush(), delay);
  };

  const enqueue = (ops: SyncOp[]) => {
    ops.forEach((op) => queue.set(opKey(op), op));
    saveQueue(userId, queue);
    schedule();
  };

  const unsubscribe = subscribe(() => {
    const next = getSnapshot();
    if (!ready || next === prev) {
      prev = next;
      return;
    }
    const ops = diffProgress(prev, next);
    if (ops.length > 0) {
      trackChanges(ops, prev);
      enqueue(ops);
    }
    prev = next;
  });

  const onOnline = () => void flush();
  window.addEventListener("online", onOnline);

  void (async () => {
    // Offline edits from a previous visit go first, so the pull includes them.
    if (!(await flush())) {
      ready = true;
      return;
    }
    const remote = await pullRemote(userId).catch(() => null);
    if (stopped) return;
    if (!remote) {
      ready = true;
      setStatus("error");
      return;
    }

    let local = getSnapshot();
    const legacy = readLegacyProgress();
    const adoptLegacy = !hasProgress(local) && legacy !== null && hasProgress(legacy);
    if (adoptLegacy) local = legacy;

    const { state, importLocal } = mergeProgress(local, remote);
    prev = state;
    replaceProgress(state);
    ready = true;

    if (importLocal) {
      enqueue(diffProgress({ ...state, completed: {}, visited: {}, bookmarks: {}, resume: null, startedAt: null }, state));
      if (adoptLegacy && (await flush())) clearLegacyProgress();
    } else if (adoptLegacy) {
      clearLegacyProgress();
    }
  })();

  return async () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    unsubscribe();
    window.removeEventListener("online", onOnline);
    if (queue.size === 0) return;
    const ok = await pushOps(userId, [...queue.values()]).catch(() => false);
    // Whatever didn't make it stays persisted for this account's next visit.
    if (ok) {
      queue.clear();
      saveQueue(userId, queue);
    }
  };
}

let active: { userId: string; stop: () => Promise<void> } | null = null;

/**
 * Sync exactly one account at a time: start for a user id, or stop (and
 * flush) with null. Safe to call repeatedly with the same id.
 */
export async function syncAccount(userId: string | null): Promise<void> {
  if (active?.userId === userId) return;
  const previous = active;
  active = null;
  if (previous) await previous.stop();
  if (userId) active = { userId, stop: startProgressSync(userId) };
}
