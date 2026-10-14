import { afterEach, describe, expect, it, vi } from "vitest";

import { getSnapshot, markComplete, recordVisit, setProgressScope, toggleBookmark } from "@/lib/progress";
import { diffProgress, EMPTY_PROGRESS, mergeProgress, type RemoteProgress } from "@/lib/sync/merge";
import { syncAccount } from "@/lib/sync/progressSync";
import { fakeDb } from "@/demo/fakeSupabase";

const USER = "00000000-0000-4000-8000-000000000001";
const noRemote: RemoteProgress = { lessons: [], bookmarks: [], resume: null, started_at: null };

describe("mergeProgress", () => {
  it("imports local progress into an empty account", () => {
    const local = { ...EMPTY_PROGRESS, completed: { a: "2026-01-01" }, visited: { a: "2026-01-01" }, startedAt: "2026-01-01" };
    expect(mergeProgress(local, noRemote)).toEqual({ state: local, importLocal: true });
  });

  it("treats the server as the source of truth once it has data", () => {
    const local = { ...EMPTY_PROGRESS, completed: { stale: "2026-01-01" }, visited: { stale: "2026-01-01" } };
    const remote: RemoteProgress = {
      lessons: [
        { lesson_id: "a", first_visited_at: "2026-02-01", completed_at: "2026-02-02" },
        { lesson_id: "b", first_visited_at: "2026-02-03", completed_at: null },
      ],
      bookmarks: [{ lesson_id: "b", created_at: "2026-02-04" }],
      resume: null,
      started_at: "2026-02-01",
    };
    const { state, importLocal } = mergeProgress(local, remote);
    expect(importLocal).toBe(false);
    expect(state.completed).toEqual({ a: "2026-02-02" });
    expect(state.visited).toEqual({ a: "2026-02-01", b: "2026-02-03" });
    expect(state.bookmarks).toEqual({ b: "2026-02-04" });
  });

  it("keeps whichever resume pointer is newer", () => {
    const localResume = { lessonId: "x", sectionId: "s", path: "/learn/s/x", scrollY: 900, at: "2026-03-02" };
    const remoteResume = { lessonId: "y", sectionId: "s", path: "/learn/s/y", scrollY: 0, at: "2026-03-01" };
    const remote = { ...noRemote, started_at: "2026-01-01", resume: remoteResume };
    expect(mergeProgress({ ...EMPTY_PROGRESS, resume: localResume }, remote).state.resume).toEqual(localResume);
    expect(mergeProgress({ ...EMPTY_PROGRESS, resume: { ...localResume, at: "2026-02-01" } }, remote).state.resume).toEqual(
      remoteResume
    );
  });
});

describe("diffProgress", () => {
  it("describes completions, un-completions and bookmarks as server writes", () => {
    const prev = { ...EMPTY_PROGRESS, completed: { a: "t1" }, visited: { a: "t0" }, bookmarks: { z: "t" } };
    const next = { ...EMPTY_PROGRESS, completed: { b: "t2" }, visited: { a: "t0", b: "t2" }, bookmarks: {} };
    expect(diffProgress(prev, next)).toEqual(
      expect.arrayContaining([
        { kind: "lesson", lessonId: "a", firstVisitedAt: "t0", completedAt: null },
        { kind: "lesson", lessonId: "b", firstVisitedAt: "t2", completedAt: "t2" },
        expect.objectContaining({ kind: "bookmark", lessonId: "z", on: false }),
      ])
    );
  });

  it("ignores small scroll movements", () => {
    const resume = { lessonId: "a", sectionId: "s", path: "/p", scrollY: 100, at: "t" };
    const prev = { ...EMPTY_PROGRESS, resume };
    expect(diffProgress(prev, { ...prev, resume: { ...resume, scrollY: 150 } })).toEqual([]);
    expect(diffProgress(prev, { ...prev, resume: { ...resume, scrollY: 2000 } })).toHaveLength(1);
  });
});

describe("progress sync", () => {
  afterEach(async () => {
    await syncAccount(null);
    setProgressScope(null);
    vi.useRealTimers();
  });

  it("imports pre-accounts progress on first sign-in and clears the old copy", async () => {
    localStorage.setItem(
      "adtech-journey-progress",
      JSON.stringify({
        version: 1,
        completed: { "basics-what-is-adtech": "2026-01-02T00:00:00Z" },
        visited: { "basics-what-is-adtech": "2026-01-01T00:00:00Z" },
        resume: null,
        startedAt: "2026-01-01T00:00:00Z",
        bookmarks: {},
      })
    );
    setProgressScope(USER);
    await syncAccount(USER);

    await vi.waitFor(() =>
      expect(fakeDb.table("lesson_progress")).toContainEqual(
        expect.objectContaining({ lesson_id: "basics-what-is-adtech", completed_at: "2026-01-02T00:00:00Z" })
      )
    );
    expect(getSnapshot().completed).toHaveProperty("basics-what-is-adtech");
    expect(localStorage.getItem("adtech-journey-progress")).toBeNull();
  });

  it("adopts the server copy for an account that already has progress", async () => {
    fakeDb.table("lesson_progress").push({
      user_id: USER,
      lesson_id: "tracking-pixels",
      first_visited_at: "2026-05-01T00:00:00Z",
      completed_at: "2026-05-02T00:00:00Z",
    });
    setProgressScope(USER);
    await syncAccount(USER);
    await vi.waitFor(() => expect(getSnapshot().completed).toEqual({ "tracking-pixels": "2026-05-02T00:00:00Z" }));
  });

  it("pushes lesson completions, bookmarks and the resume point", async () => {
    setProgressScope(USER);
    await syncAccount(USER);
    await vi.waitFor(() => expect(fakeDb.writes.length).toBeGreaterThanOrEqual(0));
    // Let the initial pull settle before making changes.
    await new Promise((r) => setTimeout(r, 20));

    recordVisit("basics-what-is-adtech", "basics", "/learn/basics/what-is-adtech");
    markComplete("basics-what-is-adtech");
    toggleBookmark("basics-what-is-adtech");

    await vi.waitFor(
      () => {
        expect(fakeDb.table("lesson_progress")).toContainEqual(
          expect.objectContaining({ lesson_id: "basics-what-is-adtech", completed_at: expect.any(String) })
        );
        expect(fakeDb.table("bookmarks")).toContainEqual(expect.objectContaining({ lesson_id: "basics-what-is-adtech" }));
        expect(fakeDb.table("profiles")[0].resume).toEqual(expect.objectContaining({ lessonId: "basics-what-is-adtech" }));
      },
      { timeout: 4000 }
    );
  });

  it("keeps each account's local progress separate", async () => {
    setProgressScope("user-a");
    markComplete("basics-what-is-adtech");
    setProgressScope("user-b");
    expect(getSnapshot().completed).toEqual({});
    setProgressScope("user-a");
    expect(getSnapshot().completed).toHaveProperty("basics-what-is-adtech");
  });
});
