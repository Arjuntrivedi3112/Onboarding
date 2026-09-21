import { afterEach, describe, expect, it, vi } from "vitest";

import { scrollToRenderedText } from "@/lib/scrollToText";

/**
 * The "jump directly there" guarantee behind content search: given the exact
 * text a lesson's search-index snippet holds, this must find the same
 * element in a rendered page and scroll to it — not just to the lesson.
 */
describe("scrollToRenderedText", () => {
  function buildRoot(paragraphs: string[]): HTMLElement {
    const root = document.createElement("div");
    root.innerHTML = paragraphs.map((p) => `<p>${p}</p>`).join("");
    document.body.appendChild(root);
    return root;
  }

  // jsdom has no real layout; setup.ts stubs scrollIntoView globally so it
  // exists to spy on. Each test only needs to know it ran, and on which element.
  const scrollIntoViewSpy = vi.spyOn(Element.prototype, "scrollIntoView");

  afterEach(() => {
    scrollIntoViewSpy.mockClear();
  });

  it("finds and scrolls to the paragraph containing the needle", () => {
    const root = buildRoot([
      "An impression is counted when an ad is fetched and rendered.",
      "A viewable impression requires at least fifty percent of the ad to be visible for one second.",
      "Click-through rate divides clicks by impressions.",
    ]);

    const found = scrollToRenderedText(root, "viewable impression requires at least fifty percent");

    expect(found).toBe(true);
    const scrolledEl = scrollIntoViewSpy.mock.contexts[0] as Element;
    expect(scrolledEl.textContent).toContain("viewable impression requires");
  });

  it("applies the highlight class to the matched element, and only that one", () => {
    const root = buildRoot([
      "First paragraph with nothing relevant in it at all.",
      "Second paragraph mentions the clearing price explicitly here.",
    ]);

    scrollToRenderedText(root, "mentions the clearing price explicitly");

    const highlighted = root.querySelectorAll(".search-highlight");
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0].textContent).toContain("clearing price");
  });

  it("picks the most specific (shortest) matching element, not an ancestor", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <ul>
        <li>Short item with the target phrase inside it.</li>
        <li>An unrelated second item.</li>
      </ul>
    `;
    document.body.appendChild(root);

    scrollToRenderedText(root, "the target phrase inside it");

    const highlighted = root.querySelector(".search-highlight");
    expect(highlighted?.tagName).toBe("LI");
  });

  it("returns false when nothing matches, and highlights nothing", () => {
    const root = buildRoot(["Completely unrelated sentence about pricing models."]);
    const found = scrollToRenderedText(root, "a phrase that does not appear anywhere in this root");
    expect(found).toBe(false);
    expect(root.querySelectorAll(".search-highlight")).toHaveLength(0);
  });

  it("is case-insensitive and tolerant of extra whitespace", () => {
    const root = buildRoot(["The   Auction   Settles In   About   100   Milliseconds."]);
    const found = scrollToRenderedText(root, "the auction settles in about 100 milliseconds");
    expect(found).toBe(true);
  });
});
