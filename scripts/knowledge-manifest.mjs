/**
 * Writes src/test/knowledge-manifest.json: a SHA-256 for every file that holds
 * the book's knowledge. The knowledge-freeze test compares against it, so any
 * edit to lesson content fails CI until someone deliberately re-runs this.
 *
 *   node scripts/knowledge-manifest.mjs
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { globSync } from "tinyglobby";

const ROOT = join(import.meta.dirname, "..");

export const KNOWLEDGE_GLOBS = [
  "src/curriculum/data.ts",
  "src/curriculum/chain.ts",
  "src/components/lessons/**/*.tsx",
  "src/data/glossary.ts",
  "scripts/build-search-index.mjs",
];

export function hashKnowledge() {
  const files = globSync(KNOWLEDGE_GLOBS, { cwd: ROOT }).sort();
  return Object.fromEntries(
    files.map((rel) => [rel, createHash("sha256").update(readFileSync(join(ROOT, rel))).digest("hex")])
  );
}

if (process.argv[1] && import.meta.filename === process.argv[1]) {
  const out = join(ROOT, "src/test/knowledge-manifest.json");
  writeFileSync(out, JSON.stringify(hashKnowledge(), null, 2) + "\n");
  console.log(`Wrote ${out}`);
}
