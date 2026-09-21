import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { bookTotalLessons } from "@/curriculum";

/**
 * Sanity checks on the generated content-search index (public/search-index.json,
 * built by scripts/build-search-index.mjs, run via the pretest hook). Guards
 * against the two failure modes that actually happened while building this:
 * CSS class strings leaking in as "content", and the extractor silently
 * finding nothing.
 */
const INDEX_PATH = path.resolve(import.meta.dirname, "../../public/search-index.json");

function readIndex(): Array<{ text: string; heading: string | null; lessonId: string }> {
  return JSON.parse(readFileSync(INDEX_PATH, "utf8"));
}

describe("search index", () => {
  it("has a substantial number of snippets from real lesson prose", () => {
    const index = readIndex();
    expect(index.length).toBeGreaterThan(1000);
  });

  it("covers lessons from every book section, not just a few", () => {
    const index = readIndex();
    const lessonIds = new Set(index.map((s) => s.lessonId));
    // Not every one of the 79 lessons is guaranteed to clear the minimum
    // snippet length, but the overwhelming majority should.
    expect(lessonIds.size).toBeGreaterThan(bookTotalLessons * 0.8);
  });

  it("contains no Tailwind-class-looking strings", () => {
    const index = readIndex();
    const classy = index.filter((s) =>
      /^(min-h-|max-h-|min-w-|max-w-|rounded|border-|bg-|text-|hover:|focus:|disabled:|px-\d|py-\d|transition|shrink-)/.test(
        s.text
      )
    );
    expect(classy).toEqual([]);
  });

  it("every snippet is real prose or a legitimate data value, not markup or code punctuation alone", () => {
    const index = readIndex();
    // Three consecutive letters catches prose; the coordinate/number pattern
    // allows legitimate content like "41.8781° N, 87.6298° W".
    const nonProse = index.filter(
      (s) => !/[a-zA-Z]{3}/.test(s.text) && !/\d+(\.\d+)?°/.test(s.text)
    );
    expect(nonProse).toEqual([]);
  });
});
