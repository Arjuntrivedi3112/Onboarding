import { beforeEach, describe, expect, it } from "vitest";

import { clearSearchHistory, getSearchHistory, recordSearchQuery } from "@/lib/searchHistory";

describe("search history", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts empty", () => {
    expect(getSearchHistory()).toEqual([]);
  });

  it("records a query, most recent first", () => {
    recordSearchQuery("header bidding");
    recordSearchQuery("floor price");
    expect(getSearchHistory()).toEqual(["floor price", "header bidding"]);
  });

  it("de-duplicates case-insensitively, moving the repeat to the front", () => {
    recordSearchQuery("header bidding");
    recordSearchQuery("floor price");
    recordSearchQuery("Header Bidding");
    expect(getSearchHistory()).toEqual(["Header Bidding", "floor price"]);
  });

  it("ignores queries shorter than 2 characters", () => {
    recordSearchQuery("a");
    recordSearchQuery(" ");
    expect(getSearchHistory()).toEqual([]);
  });

  it("caps at 6 entries", () => {
    for (let i = 0; i < 10; i++) recordSearchQuery(`query ${i}`);
    const history = getSearchHistory();
    expect(history).toHaveLength(6);
    expect(history[0]).toBe("query 9");
  });

  it("clears on request", () => {
    recordSearchQuery("header bidding");
    clearSearchHistory();
    expect(getSearchHistory()).toEqual([]);
  });

  it("tolerates corrupted storage", () => {
    localStorage.setItem("adtech-journey-search-history", "not json");
    expect(getSearchHistory()).toEqual([]);
  });
});
