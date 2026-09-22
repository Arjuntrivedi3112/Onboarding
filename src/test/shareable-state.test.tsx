import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { enumCodec, numberCodec, stringCodec, useShareableState } from "@/hooks/useShareableState";

function wrapper(initialEntries: string[]) {
  return ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
  );
}

describe("useShareableState", () => {
  it("starts at the default when the URL has no matching param", () => {
    const { result } = renderHook(() => useShareableState("mode", "direct", stringCodec), {
      wrapper: wrapper(["/lesson"]),
    });
    expect(result.current[0]).toBe("direct");
  });

  it("reads the initial value from the URL when present", () => {
    const { result } = renderHook(() => useShareableState("mode", "direct", stringCodec), {
      wrapper: wrapper(["/lesson?mode=programmatic"]),
    });
    expect(result.current[0]).toBe("programmatic");
  });

  it("setting the value updates what the hook returns", () => {
    const { result } = renderHook(() => useShareableState("mode", "direct", stringCodec), {
      wrapper: wrapper(["/lesson"]),
    });

    act(() => result.current[1]("both-servers"));

    expect(result.current[0]).toBe("both-servers");
  });

  it("rejects a value outside an enum codec's allowed set, falling back to default", () => {
    const codec = enumCodec(["a", "b", "c"] as const);
    const { result } = renderHook(() => useShareableState("choice", "a" as const, codec), {
      wrapper: wrapper(["/lesson?choice=not-a-real-option"]),
    });
    expect(result.current[0]).toBe("a");
  });

  it("rejects an out-of-range number, falling back to default", () => {
    const codec = numberCodec(0, 100);
    const { result } = renderHook(() => useShareableState("threshold", 50, codec), {
      wrapper: wrapper(["/lesson?threshold=99999"]),
    });
    expect(result.current[0]).toBe(50);
  });

  it("rejects a non-numeric value for a number codec", () => {
    const codec = numberCodec(0, 100);
    const { result } = renderHook(() => useShareableState("threshold", 50, codec), {
      wrapper: wrapper(["/lesson?threshold=banana"]),
    });
    expect(result.current[0]).toBe(50);
  });

  it("accepts a valid in-range number from the URL", () => {
    const codec = numberCodec(0, 100);
    const { result } = renderHook(() => useShareableState("threshold", 50, codec), {
      wrapper: wrapper(["/lesson?threshold=72"]),
    });
    expect(result.current[0]).toBe(72);
  });
});
