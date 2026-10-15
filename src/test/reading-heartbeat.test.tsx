import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fakeDb } from "@/demo/fakeSupabase";
import { useReadingHeartbeat } from "@/hooks/useReadingHeartbeat";

describe("reading heartbeat", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("actually sends reading time to the server while a lesson is being read", async () => {
    const sent: Array<Record<string, unknown>> = [];
    fakeDb.rpcHandlers.add_lesson_time = (args) => {
      sent.push(args);
    };

    const { unmount } = renderHook(() => useReadingHeartbeat("basics-what-is-adtech"));

    // Keep the learner "active" so the idle rule doesn't discard the time.
    for (let i = 0; i < 7; i++) {
      window.dispatchEvent(new Event("pointermove"));
      await vi.advanceTimersByTimeAsync(5_000);
    }
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ p_lesson_id: "basics-what-is-adtech" });
    expect(Number(sent[0].p_seconds)).toBeGreaterThanOrEqual(30);

    // Leaving the lesson sends the partial interval.
    for (let i = 0; i < 2; i++) {
      window.dispatchEvent(new Event("pointermove"));
      await vi.advanceTimersByTimeAsync(5_000);
    }
    unmount();
    await vi.advanceTimersByTimeAsync(0);
    expect(sent).toHaveLength(2);
  });

  it("sends nothing for a lesson that was open for only a moment", async () => {
    const sent: unknown[] = [];
    fakeDb.rpcHandlers.add_lesson_time = (args) => void sent.push(args);
    const { unmount } = renderHook(() => useReadingHeartbeat("basics-what-is-adtech"));
    await vi.advanceTimersByTimeAsync(2_000);
    unmount();
    await vi.advanceTimersByTimeAsync(0);
    expect(sent).toHaveLength(0);
  });
});
