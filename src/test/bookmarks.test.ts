import { beforeEach, describe, expect, it, vi } from "vitest";

import { addBookmark, getSnapshot, removeBookmark, resetProgress, toggleBookmark } from "@/lib/progress";

describe("bookmarks", () => {
  // progress.ts caches state in memory, not just in localStorage — clearing
  // storage alone would leave a stale in-memory cache behind between tests.
  // resetProgress() clears both.
  beforeEach(() => {
    resetProgress();
  });

  it("starts with no bookmarks", () => {
    expect(getSnapshot().bookmarks).toEqual({});
  });

  it("adds a bookmark with a timestamp", () => {
    addBookmark("basics-what-is-adtech");
    const { bookmarks } = getSnapshot();
    expect(bookmarks["basics-what-is-adtech"]).toBeTypeOf("string");
  });

  it("removes a bookmark", () => {
    addBookmark("basics-what-is-adtech");
    removeBookmark("basics-what-is-adtech");
    expect(getSnapshot().bookmarks).toEqual({});
  });

  it("toggleBookmark adds when absent, removes when present", () => {
    toggleBookmark("mediabuying-rtb-auction-in-100ms");
    expect(getSnapshot().bookmarks["mediabuying-rtb-auction-in-100ms"]).toBeDefined();

    toggleBookmark("mediabuying-rtb-auction-in-100ms");
    expect(getSnapshot().bookmarks["mediabuying-rtb-auction-in-100ms"]).toBeUndefined();
  });

  it("is a no-op to add the same bookmark twice", () => {
    addBookmark("basics-what-is-adtech");
    const first = getSnapshot().bookmarks["basics-what-is-adtech"];
    addBookmark("basics-what-is-adtech");
    expect(getSnapshot().bookmarks["basics-what-is-adtech"]).toBe(first);
  });

  it("doesn't affect completion or visited state", () => {
    addBookmark("basics-what-is-adtech");
    const state = getSnapshot();
    expect(state.completed).toEqual({});
    expect(state.visited).toEqual({});
  });

  it("tolerates a corrupted bookmarks value already in storage", async () => {
    localStorage.setItem(
      "adtech-journey-progress",
      JSON.stringify({ version: 1, completed: {}, visited: {}, resume: null, startedAt: null, bookmarks: "not-an-object" })
    );
    // progress.ts caches its parsed state in module scope, so a fresh module
    // instance is needed to actually exercise the parse-on-first-read path
    // rather than reading back the already-reset in-memory cache.
    vi.resetModules();
    const fresh = await import("@/lib/progress");
    expect(fresh.getSnapshot().bookmarks).toEqual({});
  });
});
