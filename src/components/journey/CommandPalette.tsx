import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookMarked,
  Check,
  FileText,
  HelpCircle,
  Layers,
  Library,
  Map,
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
import { lessonList, lessonPath, sectionList, sectionPath } from "@/curriculum";
import { useProgress } from "@/hooks/useProgress";

/** Fired by any visible trigger (e.g. the sidebar search button) to open the palette. */
export const OPEN_COMMAND_PALETTE_EVENT = "adtech-journey:open-command-palette";

export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT));
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
 * reference page reachable from anywhere without touching the sidebar.
 *
 * Mounted once in the layout so the shortcut works regardless of which page
 * is open. cmdk does the fuzzy matching; this component only supplies what
 * to match against and where each result goes.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
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

  function go(to: string) {
    setOpen(false);
    navigate(to);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Jump to a lesson, section, or tool…" />
      <CommandList>
        <CommandEmpty>No matches. Try a different word.</CommandEmpty>

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
