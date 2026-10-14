import { describe, expect, it } from "vitest";

import { hashKnowledge } from "../../scripts/knowledge-manifest.mjs";
import manifest from "./knowledge-manifest.json";

/**
 * The book's content is frozen. Platform work (accounts, the Lab, the admin
 * console) must never change what the lessons say. If this fails and the
 * content change is intentional, regenerate with
 * `node scripts/knowledge-manifest.mjs` in the same commit.
 */
describe("knowledge freeze", () => {
  it("leaves every lesson, the curriculum and the glossary byte-identical", () => {
    expect(hashKnowledge()).toEqual(manifest);
  });
});
