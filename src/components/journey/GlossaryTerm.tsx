import { Link } from "react-router-dom";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { GlossaryTerm as GlossaryTermData } from "@/data/glossary";

/**
 * An inline, tap-or-click term definition — the first time a glossary term
 * appears in a lesson's objectives or takeaways (see glossaryHighlight.tsx
 * for where "first" is decided). A real <button> with both a dotted
 * underline and a color, never color alone, so it reads as interactive to
 * everyone, not just people who can see the tint.
 */
export function GlossaryTerm({ entry, children }: { entry: GlossaryTermData; children: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="rounded-sm text-primary underline decoration-dotted decoration-1 underline-offset-4 hover:decoration-solid focus-visible:decoration-solid"
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-sm">
        <p className="font-display text-base text-foreground">
          {entry.term}
          {entry.full && entry.full !== entry.term && (
            <span className="ml-1.5 font-sans text-sm font-normal text-muted-foreground">
              — {entry.full}
            </span>
          )}
        </p>
        <p className="mt-1.5 text-muted-foreground">{entry.def}</p>
        <Link to="/glossary" className="mt-2 inline-block text-xs text-primary hover:underline">
          See all terms →
        </Link>
      </PopoverContent>
    </Popover>
  );
}
