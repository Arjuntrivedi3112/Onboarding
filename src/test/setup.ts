import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Database suites opt into the node environment; everything below is DOM-only.
const hasDom = typeof window !== "undefined";

afterEach(() => {
  if (!hasDom) return;
  cleanup();
  localStorage.clear();
});

if (hasDom) {
  // jsdom implements neither of these, and the app uses both.
  window.matchMedia =
    window.matchMedia ||
    ((query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList);

  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  Element.prototype.scrollIntoView =
    Element.prototype.scrollIntoView || vi.fn();

  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver =
    window.ResizeObserver || (ResizeObserverStub as never);
}
