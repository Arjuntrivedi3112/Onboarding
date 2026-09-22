import { Fragment, type ReactNode } from "react";

import { GlossaryTerm } from "@/components/journey/GlossaryTerm";
import { GLOSSARY } from "@/data/glossary";

/**
 * Wraps the first occurrence of a glossary term in plain lesson text with an
 * inline, tappable definition — scoped deliberately to `objectives` and
 * `takeaways`, the two LessonContent fields that are guaranteed plain
 * strings. `whyThisMatters` and the lesson `Body` are ReactNode/interactive
 * components in every one of the 79 lessons, so matching text inside them
 * would mean mutating a live, stateful DOM subtree from outside React —
 * safe here because these two fields are static once rendered.
 *
 * "First occurrence" is scoped to one lesson, tracked by the caller passing
 * the same `seen` Set across every call for that lesson (see LessonShell.tsx)
 * — so the term is live exactly once, wherever it's first encountered
 * reading top to bottom, and plain text everywhere after.
 */

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Longest term first, so "First-Party Data" matches before a shorter
// overlapping term would.
const byLengthDesc = [...GLOSSARY].sort((a, b) => b.short.length - a.short.length);
const lookup = new Map(byLengthDesc.map((entry) => [entry.short.toLowerCase(), entry]));
const pattern = new RegExp(
  `\\b(${byLengthDesc.map((entry) => escapeRegex(entry.short)).join("|")})\\b`,
  "gi"
);

export function highlightGlossaryTerms(text: string, seen: Set<string>): ReactNode {
  pattern.lastIndex = 0;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text))) {
    const matched = match[0];
    const entry = lookup.get(matched.toLowerCase());
    if (!entry || seen.has(entry.id)) continue;

    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    seen.add(entry.id);
    parts.push(
      <GlossaryTerm key={`gt-${key++}`} entry={entry}>
        {matched}
      </GlossaryTerm>
    );
    lastIndex = match.index + matched.length;
  }

  const rest = text.slice(lastIndex);
  if (parts.length === 0) return text;
  return (
    <Fragment>
      {parts}
      {rest}
    </Fragment>
  );
}
