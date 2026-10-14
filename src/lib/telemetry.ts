/**
 * Learning-activity events for the admin console (who is active, what they
 * open, where they get stuck). Batched and best-effort: a failed send is
 * dropped rather than retried forever, and nothing here can break the page.
 *
 * Event types are constrained in the database (activity_events.type).
 */
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type ActivityType =
  | "login"
  | "lesson_view"
  | "lesson_complete"
  | "lesson_uncomplete"
  | "sim_open"
  | "sim_pass"
  | "search"
  | "chat_question"
  | "bookmark"
  | "self_check"
  | "feedback"
  | "badge"
  | "onboarding_complete"
  | "tour_complete";

interface PendingEvent {
  user_id: string;
  type: ActivityType;
  lesson_id: string | null;
  sim_id: string | null;
  meta: Json;
  created_at: string;
}

const FLUSH_AFTER_MS = 4000;
const MAX_BUFFER = 50;

let userId: string | null = null;
let buffer: PendingEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

export function setTelemetryUser(id: string | null) {
  if (userId && id !== userId) void flushTelemetry();
  userId = id;
}

export function track(type: ActivityType, details: { lessonId?: string; simId?: string; meta?: Record<string, Json> } = {}) {
  if (!userId) return;
  buffer.push({
    user_id: userId,
    type,
    lesson_id: details.lessonId ?? null,
    sim_id: details.simId ?? null,
    meta: (details.meta ?? {}) as Json,
    created_at: new Date().toISOString(),
  });
  if (buffer.length >= MAX_BUFFER) void flushTelemetry();
  else if (!timer) timer = setTimeout(() => void flushTelemetry(), FLUSH_AFTER_MS);
}

export async function flushTelemetry() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (buffer.length === 0) return;
  const batch = buffer;
  buffer = [];
  try {
    await supabase.from("activity_events").insert(batch);
  } catch {
    // Best effort.
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flushTelemetry();
  });
}

/** One "login" per account per browser session — what "active today" means. */
export function trackSessionStart(id: string) {
  const key = `adtech-session-tracked:${id}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // Private mode: still count it.
  }
  track("login");
}
