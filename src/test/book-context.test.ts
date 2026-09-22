import { describe, expect, it } from "vitest";

import { formatBookContext, pickRelevantExcerpts, type ContentSnippet } from "@/lib/bookContext";

function snippet(overrides: Partial<ContentSnippet>): ContentSnippet {
  return {
    sectionId: "mediabuying",
    slug: "rtb-auction-in-100ms",
    lessonId: "mediabuying-rtb-auction-in-100ms",
    lessonTitle: "Real-time bidding: one impression, 100 milliseconds",
    sectionTitle: "Media buying",
    heading: null,
    text: "",
    ...overrides,
  };
}

describe("pickRelevantExcerpts", () => {
  const index: ContentSnippet[] = [
    snippet({
      heading: "Header bidding",
      text: "Header bidding lets multiple demand sources bid on an impression before the publisher's ad server makes its call.",
    }),
    snippet({
      lessonId: "identity-cookies",
      lessonTitle: "Cookies and the stateless web",
      text: "A cookie is a small piece of data a website asks the browser to store and send back on later requests.",
    }),
    snippet({
      text: "The auction settles in about 100 milliseconds, faster than the blink of an eye.",
    }),
  ];

  it("ranks the excerpt matching the most query terms first", () => {
    const results = pickRelevantExcerpts(index, "how does header bidding work?");
    expect(results[0].heading).toBe("Header bidding");
  });

  it("ignores stopwords and short filler words when scoring", () => {
    const results = pickRelevantExcerpts(index, "what is a cookie");
    expect(results[0].lessonTitle).toBe("Cookies and the stateless web");
  });

  it("returns nothing for a query with no matching terms in the index", () => {
    const results = pickRelevantExcerpts(index, "xyzzyplugh nonexistent term");
    expect(results).toEqual([]);
  });

  it("returns nothing for an empty or purely conversational query", () => {
    expect(pickRelevantExcerpts(index, "")).toEqual([]);
    expect(pickRelevantExcerpts(index, "please tell me about this")).toEqual([]);
  });

  it("respects the limit", () => {
    const bigIndex = Array.from({ length: 20 }, (_, i) =>
      snippet({ text: `Auction number ${i} settles in milliseconds.` })
    );
    const results = pickRelevantExcerpts(bigIndex, "auction milliseconds", 3);
    expect(results).toHaveLength(3);
  });
});

describe("formatBookContext", () => {
  it("returns an empty string for no excerpts, never a misleading placeholder", () => {
    expect(formatBookContext([])).toBe("");
  });

  it("includes the lesson title and heading so the model can cite where it came from", () => {
    const text = formatBookContext([
      snippet({ lessonTitle: "Real-time bidding", heading: "Header bidding", text: "Some fact." }),
    ]);
    expect(text).toContain("Real-time bidding");
    expect(text).toContain("Header bidding");
    expect(text).toContain("Some fact.");
  });
});
