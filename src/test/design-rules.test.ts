import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { globSync } from "tinyglobby";

/**
 * Executable design rules.
 *
 * The visual system only stays coherent if the rules are checked rather than
 * remembered. Every rule here traces to a measured finding from the HIG audit:
 * gradients that produced 1.68:1 text, prose set at 12px, translucent material
 * used on content surfaces, focus indicators removed, motion that loops forever.
 *
 * Scope: the journey code. The remaining legacy reference modules
 * (glossary, library, notes, ecosystem map) are listed in LEGACY and are
 * exempt until they are migrated — the list is expected to shrink to nothing.
 */

const ROOT = join(__dirname, "..", "..");

const SCOPES = [
  "src/components/lessons/**/*.tsx",
  "src/components/journey/**/*.tsx",
  "src/pages/**/*.tsx",
  "src/hooks/**/*.ts",
  "src/curriculum/**/*.ts",
];

/** Files not yet migrated. This list should only ever get shorter. */
const LEGACY: string[] = [];

function sourceFiles(): Array<{ path: string; text: string }> {
  return globSync(SCOPES, { cwd: ROOT, absolute: false })
    .filter((rel) => !LEGACY.some((legacy) => rel.includes(legacy)))
    .map((rel) => ({ path: rel, text: readFileSync(join(ROOT, rel), "utf8") }));
}

/** Report every offending line so a failure names the exact place to fix. */
function offenders(pattern: RegExp, skip?: (line: string) => boolean): string[] {
  const hits: string[] = [];
  for (const file of sourceFiles()) {
    file.text.split("\n").forEach((line, i) => {
      if (skip?.(line)) return;
      const re = new RegExp(pattern.source, pattern.flags.replace("g", ""));
      if (re.test(line)) hits.push(`${file.path}:${i + 1}  ${line.trim().slice(0, 110)}`);
    });
  }
  return hits;
}

describe("colour discipline", () => {
  it("uses no literal colour values", () => {
    // Hex, rgb() and bare hsl() bypass the token system and cannot adapt to
    // the light and dark appearances.
    expect(
      offenders(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|(?<!var\()\bhsl\(\s*\d/)
    ).toEqual([]);
  });

  it("uses no Tailwind palette colours", () => {
    // The palette is semantic: foreground/muted-foreground/primary/etc.
    // A raw palette hue means one colour no longer means one thing.
    expect(
      offenders(
        /\b(?:text|bg|border|ring|fill|stroke|from|to|via)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/
      )
    ).toEqual([]);
  });

  it("uses no gradients", () => {
    // Every measured white-on-gradient pair failed contrast (1.68:1 to 3.96:1).
    expect(offenders(/bg-gradient-|\bbg-clip-text\b/)).toEqual([]);
  });

  it("uses no text-white", () => {
    expect(offenders(/\btext-white\b/)).toEqual([]);
  });

  it("keeps chain hues out of interface chrome", () => {
    // Chain colours encode supply-chain position. They are permitted in the
    // chain rail and the ecosystem map only.
    const hits = sourceFiles()
      .filter(
        (f) =>
          !f.path.includes("ChainRail") &&
          !f.path.includes("ecosystem") &&
          !f.path.includes("curriculum/chain")
      )
      .flatMap((f) =>
        f.text
          .split("\n")
          .map((line, i) => ({ line, i }))
          .filter(({ line }) => /--chain-|\bchain-(?:advertiser|dsp|ssp|exchange|publisher|user)\b/.test(line))
          .map(({ line, i }) => `${f.path}:${i + 1}  ${line.trim().slice(0, 110)}`)
      );
    expect(hits).toEqual([]);
  });
});

describe("materials and motion", () => {
  it("uses no translucent material on content surfaces", () => {
    // HIG puts blur on the floating interactive layer, never in content.
    expect(offenders(/\bglass\b|backdrop-blur/)).toEqual([]);
  });

  it("uses no glow effects", () => {
    expect(offenders(/glow-primary|glow-accent|text-glow|border-glow/)).toEqual([]);
  });

  it("has no infinite animation", () => {
    expect(offenders(/repeat:\s*Infinity|animate-(?:float|pulse-glow|flow|spin|pulse)\b/)).toEqual(
      []
    );
  });
});

describe("typography", () => {
  it("sets nothing below the 12px label floor", () => {
    expect(offenders(/text-\[(?:[0-9]|10|11)px\]/)).toEqual([]);
  });

  it("uses no arbitrary font sizes that bypass the rem scale", () => {
    // Arbitrary px sizes do not scale with browser zoom or OS text size.
    expect(offenders(/text-\[\d+px\]/)).toEqual([]);
  });
});

describe("interaction and accessibility", () => {
  it("has no click handler on a non-interactive element", () => {
    // A div with onClick is invisible to keyboards and screen readers.
    expect(offenders(/<(?:div|span|li|section|article)\b[^>]*\bonClick=/)).toEqual([]);
  });

  it("never removes the focus indicator without replacing it", () => {
    const hits = sourceFiles().flatMap((f) =>
      f.text
        .split("\n")
        .map((line, i) => ({ line, i }))
        .filter(({ line }) => /focus:outline-none/.test(line) && !/focus-visible:/.test(line))
        .map(({ line, i }) => `${f.path}:${i + 1}  ${line.trim().slice(0, 110)}`)
    );
    expect(hits).toEqual([]);
  });
});

describe("writing", () => {
  it("uses 'and' rather than an ampersand in prose", () => {
    // JSX entities, aria/class attributes and code are not prose.
    const hits = sourceFiles().flatMap((f) =>
      f.text
        .split("\n")
        .map((line, i) => ({ line, i }))
        .filter(({ line }) => />\s*[^<>]*\s&\s[^<>]*</.test(line) && !/&&|&[a-z]+;/.test(line))
        .map(({ line, i }) => `${f.path}:${i + 1}  ${line.trim().slice(0, 110)}`)
    );
    expect(hits).toEqual([]);
  });
});

describe("rule coverage", () => {
  it("actually scanned the journey source", () => {
    const files = sourceFiles();
    expect(files.length).toBeGreaterThan(10);
    expect(files.some((f) => f.path.includes("components/lessons/"))).toBe(true);
  });
});
