import { describe, expect, it } from "vitest";

import { bookSections, curriculum, findLesson, sectionList } from "@/curriculum";
import { SIMULATIONS, simulationForLesson, simulationForSection } from "@/simulations/registry";
import { betaWinsCheaply, runAuction } from "@/simulations/rtb-auction/logic";

describe("simulation registry", () => {
  it("has exactly one simulator per section", () => {
    for (const section of sectionList) {
      expect(SIMULATIONS.filter((s) => s.sectionId === section.id), section.id).toHaveLength(1);
    }
    expect(SIMULATIONS).toHaveLength(sectionList.length);
    expect(simulationForSection(bookSections[0].id)).toBeDefined();
  });

  it("uses unique ids and links only to lessons that exist in the right section", () => {
    expect(new Set(SIMULATIONS.map((s) => s.id)).size).toBe(SIMULATIONS.length);
    for (const sim of SIMULATIONS) {
      expect(sim.relatedLessonIds.length, sim.id).toBeGreaterThan(0);
      for (const lessonId of sim.relatedLessonIds) {
        const ref = findLesson(curriculum, lessonId);
        expect(ref, `${sim.id} → ${lessonId}`).not.toBeNull();
        expect(ref!.section.id).toBe(sim.sectionId);
      }
      expect(simulationForLesson(sim.relatedLessonIds[0])?.id).toBe(sim.id);
    }
  });

  it("gives every simulator guidance and a challenge", () => {
    for (const sim of SIMULATIONS) {
      expect(sim.whatYoullSee.length, sim.id).toBeGreaterThanOrEqual(2);
      expect(sim.tryThis.length, sim.id).toBeGreaterThanOrEqual(3);
      expect(sim.challenge.title && sim.challenge.description && sim.challenge.hint, sim.id).toBeTruthy();
    }
  });

  it("loads every simulator module", async () => {
    for (const sim of SIMULATIONS) {
      const mod = await sim.load();
      expect(typeof mod.default, sim.id).toBe("function");
    }
  });
});

describe("RTB auction logic", () => {
  const bids = { alpha: 4.5, beta: 3.8, gamma: 2.9 };

  it("charges the second-price winner one cent over the runner-up", () => {
    expect(runAuction(bids, 1, "second")).toMatchObject({ winner: "alpha", price: 3.81, runnerUp: "beta" });
  });

  it("charges the first-price winner its own bid", () => {
    expect(runAuction(bids, 1, "first")).toMatchObject({ winner: "alpha", price: 4.5 });
  });

  it("drops bids under the floor and charges the floor when only one remains", () => {
    expect(runAuction(bids, 4, "second")).toMatchObject({ eligible: ["alpha"], winner: "alpha", price: 4.01 });
  });

  it("leaves the impression unsold when every bid is under the floor", () => {
    expect(runAuction(bids, 5, "second")).toMatchObject({ winner: null, price: null });
  });

  it("recognises the challenge's winning configurations", () => {
    expect(betaWinsCheaply(runAuction({ alpha: 3.2, beta: 3.8, gamma: 2.9 }, 1, "second"))).toBe(true);
    expect(betaWinsCheaply(runAuction(bids, 1, "second"))).toBe(false);
    expect(betaWinsCheaply(runAuction({ alpha: 3.2, beta: 3.8, gamma: 2.9 }, 1, "first"))).toBe(false);
  });
});
