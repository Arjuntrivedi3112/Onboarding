import type { ProgressState, ResumePointer } from "@/lib/progress";

/**
 * Pure pieces of progress sync, kept apart from the network so they can be
 * tested exhaustively.
 */

export interface RemoteLessonRow {
  lesson_id: string;
  first_visited_at: string | null;
  completed_at: string | null;
}

export interface RemoteProgress {
  lessons: RemoteLessonRow[];
  bookmarks: Array<{ lesson_id: string; created_at: string }>;
  resume: ResumePointer | null;
  started_at: string | null;
}

export type SyncOp =
  | { kind: "lesson"; lessonId: string; firstVisitedAt: string | null; completedAt: string | null }
  | { kind: "bookmark"; lessonId: string; on: boolean; at: string }
  | { kind: "profile"; resume: ResumePointer | null; startedAt: string | null };

export const EMPTY_PROGRESS: ProgressState = {
  version: 1,
  completed: {},
  visited: {},
  resume: null,
  startedAt: null,
  bookmarks: {},
};

export function hasProgress(state: ProgressState): boolean {
  return (
    Object.keys(state.completed).length > 0 ||
    Object.keys(state.visited).length > 0 ||
    Object.keys(state.bookmarks).length > 0 ||
    state.startedAt !== null
  );
}

export function remoteHasData(remote: RemoteProgress): boolean {
  return remote.lessons.length > 0 || remote.bookmarks.length > 0 || remote.started_at !== null;
}

function isResumePointer(value: unknown): value is ResumePointer {
  const r = value as ResumePointer | null;
  return Boolean(
    r && typeof r.lessonId === "string" && typeof r.sectionId === "string" && typeof r.path === "string" && typeof r.at === "string"
  );
}

export function remoteToState(remote: RemoteProgress): ProgressState {
  const completed: Record<string, string> = {};
  const visited: Record<string, string> = {};
  for (const row of remote.lessons) {
    if (row.completed_at) completed[row.lesson_id] = row.completed_at;
    const seen = row.first_visited_at ?? row.completed_at;
    if (seen) visited[row.lesson_id] = seen;
  }
  const bookmarks: Record<string, string> = {};
  for (const row of remote.bookmarks) bookmarks[row.lesson_id] = row.created_at;
  return {
    version: 1,
    completed,
    visited,
    bookmarks,
    resume: isResumePointer(remote.resume) ? { ...remote.resume, scrollY: Number(remote.resume.scrollY) || 0 } : null,
    startedAt: remote.started_at,
  };
}

function earliest(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a < b ? a : b;
}

/**
 * Decide the state to adopt after pulling the server copy.
 *
 * Once an account has server data, the server is the source of truth for
 * completions, visits and bookmarks (local edits were flushed before the
 * pull). Only the resume pointer — "where was I just now" — prefers
 * whichever is newer. An account with nothing on the server adopts what is
 * on this device, which is how pre-accounts progress gets imported.
 */
export function mergeProgress(local: ProgressState, remote: RemoteProgress): { state: ProgressState; importLocal: boolean } {
  if (!remoteHasData(remote)) {
    return { state: local, importLocal: hasProgress(local) };
  }
  const server = remoteToState(remote);
  const resume =
    local.resume && (!server.resume || local.resume.at > server.resume.at) ? local.resume : server.resume;
  return {
    state: { ...server, resume, startedAt: earliest(server.startedAt, local.startedAt) },
    importLocal: false,
  };
}

/** The writes that turn `prev` into `next` on the server. */
export function diffProgress(prev: ProgressState, next: ProgressState): SyncOp[] {
  const ops: SyncOp[] = [];
  const lessonIds = new Set([
    ...Object.keys(prev.completed),
    ...Object.keys(next.completed),
    ...Object.keys(prev.visited),
    ...Object.keys(next.visited),
  ]);
  for (const lessonId of lessonIds) {
    if (prev.completed[lessonId] === next.completed[lessonId] && prev.visited[lessonId] === next.visited[lessonId]) continue;
    ops.push({
      kind: "lesson",
      lessonId,
      firstVisitedAt: next.visited[lessonId] ?? next.completed[lessonId] ?? null,
      completedAt: next.completed[lessonId] ?? null,
    });
  }

  const bookmarkIds = new Set([...Object.keys(prev.bookmarks), ...Object.keys(next.bookmarks)]);
  for (const lessonId of bookmarkIds) {
    const was = prev.bookmarks[lessonId];
    const now = next.bookmarks[lessonId];
    if (was === now) continue;
    ops.push({ kind: "bookmark", lessonId, on: Boolean(now), at: now ?? new Date().toISOString() });
  }

  // Scroll moves constantly while reading; only a meaningful jump (or a new
  // lesson) is worth a server write.
  const scrollBucket = (r: ResumePointer | null) => Math.round((r?.scrollY ?? 0) / 400);
  const resumeChanged =
    prev.resume?.lessonId !== next.resume?.lessonId ||
    scrollBucket(prev.resume) !== scrollBucket(next.resume) ||
    prev.startedAt !== next.startedAt;
  if (resumeChanged) ops.push({ kind: "profile", resume: next.resume, startedAt: next.startedAt });

  return ops;
}

/** Key under which later ops replace earlier ones in the queue. */
export function opKey(op: SyncOp): string {
  return op.kind === "profile" ? "profile" : `${op.kind}:${op.lessonId}`;
}
