import { describe, expect, it } from "vitest";

import { bookLessonIds, curriculum, sectionList } from "@/curriculum";
import { ACHIEVEMENTS, currentStreak, earnedAchievements, shiftDay, weekStart } from "@/lib/achievements";
import { buildLearningPath, nextOnPath, parseLearningPath, pathMinutes, weeksToFinish } from "@/lib/learningPath";

const allSections = sectionList.map((s) => s.id);

describe("learning path", () => {
  it("never drops a section", () => {
    for (const team of ["Sales", "Engineering", "Finance", "Other", null]) {
      const path = buildLearningPath(team, { foundations: 5, strategy: 1 });
      expect([...path.order].sort()).toEqual([...allSections].sort());
    }
  });

  it("puts foundations first, then the team's core sections", () => {
    const path = buildLearningPath("AdOps", {});
    expect(path.order[0]).toBe("basics");
    expect(path.order.slice(0, 4)).toEqual(expect.arrayContaining(["adserving", "tracking"]));
    expect(path.focus.adserving).toBe("core");
    expect(path.focus.identity).toBe("standard");
  });

  it("marks parts the learner already knows as skim and moves them later", () => {
    const path = buildLearningPath("Sales", { foundations: 5 });
    expect(path.focus.basics).toBe("skim");
    expect(path.order.indexOf("basics")).toBeGreaterThan(path.order.indexOf("mediabuying"));
  });

  it("counts skim sections at half time and estimates weeks", () => {
    const full = pathMinutes(buildLearningPath("Other", {}));
    const skimmed = pathMinutes(buildLearningPath("Other", { foundations: 5, "supply-chain": 5 }));
    expect(skimmed).toBeLessThan(full);
    expect(weeksToFinish(600, 60)).toBe(10);
    expect(weeksToFinish(5, 60)).toBe(1);
  });

  it("finds the next unfinished lesson along the path", () => {
    const path = buildLearningPath("Engineering", {});
    const first = nextOnPath(path, () => false);
    expect(first?.section.id).toBe(path.order[0]);
    const done = new Set(curriculum.flatMap((p) => p.sections.flatMap((s) => s.lessons.map((l) => l.id))));
    expect(nextOnPath(path, (id) => done.has(id))).toBeNull();
  });

  it("parses stored paths defensively", () => {
    expect(parseLearningPath(null)).toBeNull();
    expect(parseLearningPath({ order: "x" })).toBeNull();
    expect(parseLearningPath({ order: ["basics", 3], focus: {} })).toEqual({ order: ["basics"], focus: {} });
  });
});

describe("streaks", () => {
  it("counts consecutive days ending today or yesterday", () => {
    const today = "2026-10-14";
    expect(currentStreak([today, "2026-10-13", "2026-10-12", "2026-10-10"], today)).toBe(3);
    expect(currentStreak(["2026-10-13", "2026-10-12"], today)).toBe(2);
    expect(currentStreak(["2026-10-11"], today)).toBe(0);
  });

  it("handles month boundaries and week starts", () => {
    expect(shiftDay("2026-11-01", -1)).toBe("2026-10-31");
    expect(weekStart("2026-10-14")).toBe("2026-10-12"); // Wednesday → Monday
    expect(weekStart("2026-10-12")).toBe("2026-10-12");
  });
});

describe("achievements", () => {
  const ctx = (over: Partial<Parameters<(typeof ACHIEVEMENTS)[number]["earned"]>[0]> = {}) => ({
    completed: new Set<string>(),
    simsOpened: 0,
    simsPassed: 0,
    totalSims: 12,
    streak: 0,
    gotIt: 0,
    notes: 0,
    ...over,
  });

  it("has unique ids", () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
  });

  it("awards nothing on day zero", () => {
    expect(earnedAchievements(ctx())).toEqual([]);
  });

  it("awards section, halfway and completion badges from completions", () => {
    const basics = sectionList.find((s) => s.id === "basics")!;
    const ids = (c: ReturnType<typeof ctx>) => earnedAchievements(c).map((a) => a.id);
    expect(ids(ctx({ completed: new Set(basics.lessons.map((l) => l.id)) }))).toEqual(
      expect.arrayContaining(["first-lesson", "section-basics"])
    );
    expect(ids(ctx({ completed: new Set(bookLessonIds) }))).toEqual(expect.arrayContaining(["halfway", "book-complete"]));
  });

  it("awards Lab and habit badges", () => {
    const ids = earnedAchievements(ctx({ simsOpened: 3, simsPassed: 12, streak: 7, gotIt: 10, notes: 5 })).map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(["lab-first", "challenge-first", "challenge-all", "streak-3", "streak-7", "self-aware", "note-taker"]));
  });
});
