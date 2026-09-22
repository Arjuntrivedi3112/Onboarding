/**
 * Journey progress store.
 *
 * Tracks which lessons a learner has completed so the dashboard can report
 * honest progress through the book. Persisted to localStorage so a new hire
 * keeps their place without needing an account.
 *
 * Design notes:
 * - The store is deliberately dumb: it records completions and last position.
 *   Policy (what counts as "complete", how % is computed) lives in the
 *   curriculum selectors, not here.
 * - State is read through a cached snapshot so it is referentially stable.
 *   `useSyncExternalStore` re-renders in a loop if `getSnapshot` returns a new
 *   object every call, so the cache is load-bearing, not an optimisation.
 * - Writes are mirrored to other tabs via the `storage` event.
 * - Every localStorage access is guarded: Safari private mode throws on
 *   setItem, and the key can hold anything a previous version wrote.
 */

const STORAGE_KEY = "adtech-journey-progress";
const SCHEMA_VERSION = 1;

export interface ResumePointer {
  lessonId: string;
  sectionId: string;
  /** Full path, so resuming restores the exact address including the appendix. */
  path: string;
  /** Scroll offset within the lesson, so a long lesson resumes where it stopped. */
  scrollY: number;
  at: string;
}

export interface ProgressState {
  version: number;
  /** lessonId -> ISO timestamp of completion */
  completed: Record<string, string>;
  /**
   * lessonId -> ISO timestamp of first open. Drives the "opened but not
   * finished" glyph. Deliberately never part of the percentage.
   */
  visited: Record<string, string>;
  /** Where the learner was last, for "pick up where you left off" */
  resume: ResumePointer | null;
  /** First time they opened the journey, for the dashboard greeting */
  startedAt: string | null;
  /**
   * lessonId -> ISO timestamp bookmarked. A personal quick-reference list,
   * deliberately separate from linear progress — bookmarking a lesson says
   * nothing about whether it's been read or completed.
   */
  bookmarks: Record<string, string>;
}

const EMPTY: ProgressState = {
  version: SCHEMA_VERSION,
  completed: {},
  visited: {},
  resume: null,
  startedAt: null,
  bookmarks: {},
};

/** Cached snapshot — see design note above. */
let cache: ProgressState | null = null;
const listeners = new Set<() => void>();

function isRecordOfStrings(value: unknown): value is Record<string, string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  return Object.values(value as Record<string, unknown>).every((v) => typeof v === "string");
}

/**
 * Parse whatever is in storage into a valid state. Anything unrecognised is
 * discarded rather than thrown, so a corrupt key can never break the app —
 * the learner loses progress, but the platform still loads.
 */
function parse(raw: string | null): ProgressState {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return EMPTY;

    const candidate = parsed as Partial<ProgressState>;
    if (candidate.version !== SCHEMA_VERSION) return EMPTY;

    const completed = isRecordOfStrings(candidate.completed) ? candidate.completed : {};
    const visited = isRecordOfStrings(candidate.visited) ? candidate.visited : {};

    let resume: ResumePointer | null = null;
    const r = candidate.resume;
    if (
      r &&
      typeof r === "object" &&
      typeof r.lessonId === "string" &&
      typeof r.sectionId === "string" &&
      typeof r.path === "string" &&
      typeof r.at === "string"
    ) {
      resume = {
        lessonId: r.lessonId,
        sectionId: r.sectionId,
        path: r.path,
        scrollY: typeof r.scrollY === "number" && Number.isFinite(r.scrollY) ? r.scrollY : 0,
        at: r.at,
      };
    }

    const bookmarks = isRecordOfStrings(candidate.bookmarks) ? candidate.bookmarks : {};

    return {
      version: SCHEMA_VERSION,
      completed,
      visited,
      resume,
      startedAt: typeof candidate.startedAt === "string" ? candidate.startedAt : null,
      bookmarks,
    };
  } catch {
    return EMPTY;
  }
}

function read(): ProgressState {
  if (cache) return cache;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode, blocked cookies) — run in memory.
  }
  cache = parse(raw);
  return cache;
}

function write(next: ProgressState) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Persisting failed; the in-memory cache still drives this session.
  }
  listeners.forEach((fn) => fn());
}

/** Subscribe to progress changes, including changes made in other tabs. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Referentially stable snapshot for `useSyncExternalStore`. */
export function getSnapshot(): ProgressState {
  return read();
}

/** Server/prerender snapshot — always the empty state. */
export function getServerSnapshot(): ProgressState {
  return EMPTY;
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    cache = parse(event.newValue);
    listeners.forEach((fn) => fn());
  });
}

function stamp(): string {
  return new Date().toISOString();
}

function withStart(state: ProgressState): ProgressState {
  return state.startedAt ? state : { ...state, startedAt: stamp() };
}

export function markComplete(lessonId: string) {
  const state = read();
  if (state.completed[lessonId]) return;
  write(
    withStart({
      ...state,
      completed: { ...state.completed, [lessonId]: stamp() },
    })
  );
}

export function markIncomplete(lessonId: string) {
  const state = read();
  if (!state.completed[lessonId]) return;
  const completed = { ...state.completed };
  delete completed[lessonId];
  write({ ...state, completed });
}

export function toggleComplete(lessonId: string) {
  if (read().completed[lessonId]) markIncomplete(lessonId);
  else markComplete(lessonId);
}

/**
 * Record that a lesson was opened, and make it the resume point.
 *
 * Called on lesson mount. Writes only when something actually changed, so
 * re-rendering a lesson does not churn localStorage or wake other tabs.
 */
export function recordVisit(lessonId: string, sectionId: string, path: string) {
  const state = read();
  const alreadyVisited = Boolean(state.visited[lessonId]);
  if (alreadyVisited && state.resume?.lessonId === lessonId) return;

  write(
    withStart({
      ...state,
      visited: alreadyVisited ? state.visited : { ...state.visited, [lessonId]: stamp() },
      resume: { lessonId, sectionId, path, scrollY: 0, at: stamp() },
    })
  );
}

/**
 * Update how far down the current lesson the learner has read. Callers are
 * expected to throttle; this only persists when the pointer already refers to
 * the lesson in question.
 */
export function recordScroll(lessonId: string, scrollY: number) {
  const state = read();
  if (!state.resume || state.resume.lessonId !== lessonId) return;
  if (Math.abs(state.resume.scrollY - scrollY) < 50) return;
  write({ ...state, resume: { ...state.resume, scrollY, at: stamp() } });
}

export function addBookmark(lessonId: string) {
  const state = read();
  if (state.bookmarks[lessonId]) return;
  write(withStart({ ...state, bookmarks: { ...state.bookmarks, [lessonId]: stamp() } }));
}

export function removeBookmark(lessonId: string) {
  const state = read();
  if (!state.bookmarks[lessonId]) return;
  const bookmarks = { ...state.bookmarks };
  delete bookmarks[lessonId];
  write({ ...state, bookmarks });
}

export function toggleBookmark(lessonId: string) {
  if (read().bookmarks[lessonId]) removeBookmark(lessonId);
  else addBookmark(lessonId);
}

/** Wipe all progress. Callers are responsible for confirming first. */
export function resetProgress() {
  write({ ...EMPTY, version: SCHEMA_VERSION });
}
