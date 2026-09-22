import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookMarked,
  Check,
  FileText,
  HelpCircle,
  Layers,
  Library,
  Map,
  Search,
  Sparkles,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { lessonBySlug, lessonList, lessonPath, sectionList, sectionPath } from "@/curriculum";
import { useProgress } from "@/hooks/useProgress";
import type { ContentSnippet } from "@/lib/bookContext";

/** Fired by any visible trigger (e.g. the sidebar search button) to open the palette. */
export const OPEN_COMMAND_PALETTE_EVENT = "adtech-journey:open-command-palette";

export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT));
}

const MAX_CONTENT_RESULTS = 8;

/**
 * Ranks content snippets against a query without cmdk's own fuzzy filter —
 * with 3000+ snippets, letting cmdk score and mount every one on every
 * keystroke would be the actual performance problem, not the search itself.
 * This runs a plain substring match, then returns only the handful worth
 * rendering.
 */
function searchContent(index: ContentSnippet[], query: string): ContentSnippet[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return [];

  const scored: { snippet: ContentSnippet; score: number }[] = [];
  for (const snippet of index) {
    const haystack = snippet.text.toLowerCase();
    const at = haystack.indexOf(needle);
    if (at === -1) continue;
    // Earlier and shorter matches first — both read as "more precisely this".
    scored.push({ snippet, score: at + snippet.text.length * 0.05 });
  }

  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, MAX_CONTENT_RESULTS).map((s) => s.snippet);
}

/** Wraps the matched substring in <mark> so the result shows exactly why it matched. */
function HighlightedSnippet({ text, query }: { text: string; query: string }) {
  const needle = query.trim();
  if (needle.length < 2) return <>{text}</>;

  const at = text.toLowerCase().indexOf(needle.toLowerCase());
  if (at === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, at)}
      <mark className="rounded-sm bg-primary/20 text-foreground">
        {text.slice(at, at + needle.length)}
      </mark>
      {text.slice(at + needle.length)}
    </>
  );
}

const REFERENCE_ITEMS = [
  { to: "/map", label: "Ecosystem map", icon: Map },
  { to: "/glossary", label: "Glossary", icon: BookMarked },
  { to: "/library", label: "Library", icon: Library },
  { to: "/notes", label: "Session notes", icon: FileText },
  { to: "/help", label: "Help", icon: HelpCircle },
];

/**
 * Global ⌘K / Ctrl+K jump — every lesson, every section, and every
 * reference page reachable from anywhere without touching the sidebar, plus
 * full-text search over every lesson's actual prose that jumps straight to
 * the matching paragraph.
 *
 * Mounted once in the layout so the shortcut works regardless of which page
 * is open. The lesson/section/reference lists are small enough to let cmdk
 * fuzzy-filter them itself; content search runs its own substring match over
 * a lazily-fetched index instead, so 3000+ snippets are never all mounted
 * into the DOM at once (see searchContent above).
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [contentIndex, setContentIndex] = useState<ContentSnippet[] | null>(null);
  const fetchedRef = useRef(false);
  const navigate = useNavigate();
  const { resume, isComplete } = useProgress();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isCombo = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (!isCombo) return;
      event.preventDefault();
      setOpen((value) => !value);
    }
    // The visible sidebar trigger opens the same dialog via this event,
    // rather than duplicating open state in two places.
    function onOpenRequest() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpenRequest);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpenRequest);
    };
  }, []);

  // Fetched once, the first time the palette is actually opened — not on
  // app load, since most sessions may never need it.
  useEffect(() => {
    if (!open || fetchedRef.current) return;
    fetchedRef.current = true;
    fetch("/search-index.json")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: ContentSnippet[]) => setContentIndex(data))
      .catch(() => {
        fetchedRef.current = false; // allow retry on next open
      });
  }, [open]);

  const contentMatches = useMemo(
    () => (contentIndex ? searchContent(contentIndex, search) : []),
    [contentIndex, search]
  );

  function go(to: string, state?: Record<string, unknown>) {
    setOpen(false);
    setSearch("");
    navigate(to, state ? { state } : undefined);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        value={search}
        onValueChange={setSearch}
        placeholder="Search lessons, sections, or any word in the book…"
      />
      <CommandList>
        <CommandEmpty>No matches. Try a different word.</CommandEmpty>

        {contentMatches.length > 0 && (
          <>
            <CommandGroup heading="In the lessons">
              {contentMatches.map((snippet, i) => {
                const ref = lessonBySlug(snippet.sectionId, snippet.slug);
                if (!ref) return null;
                return (
                  <CommandItem
                    key={`${snippet.lessonId}-${i}`}
                    value={`content-${snippet.lessonId}-${i}`}
                    onSelect={() => go(lessonPath(ref), { scrollToText: snippet.text })}
                  >
                    <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">
                        <HighlightedSnippet text={snippet.text} query={search} />
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {snippet.lessonTitle}
                        {snippet.heading ? ` · ${snippet.heading}` : ""}
                      </span>
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {resume && (
          <>
            <CommandGroup heading="Continue">
              <CommandItem
                value={`continue resume ${resume.lesson.title}`}
                onSelect={() => go(lessonPath(resume))}
              >
                <Sparkles className="mr-2 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">Continue: {resume.lesson.title}</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Sections">
          {sectionList.map((section) => (
            <CommandItem
              key={section.id}
              value={`section ${section.title} ${section.summary}`}
              onSelect={() => go(sectionPath(section))}
            >
              <Layers className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">
                {section.bookChapter > 0 ? `Section ${section.number} · ` : "Appendix · "}
                {section.title}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Lessons">
          {lessonList.map((ref) => (
            <CommandItem
              key={ref.lesson.id}
              value={`lesson ${ref.lesson.title} ${ref.section.title} ${ref.lesson.summary}`}
              onSelect={() => go(lessonPath(ref))}
            >
              {isComplete(ref.lesson.id) ? (
                <Check className="mr-2 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              ) : (
                <span className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <span className="min-w-0 flex-1 truncate">{ref.lesson.title}</span>
              <span className="ml-2 shrink-0 truncate text-xs text-muted-foreground">
                {ref.section.title}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Reference">
          {REFERENCE_ITEMS.map(({ to, label, icon: Icon }) => (
            <CommandItem key={to} value={`reference ${label}`} onSelect={() => go(to)}>
              <Icon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              {label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
