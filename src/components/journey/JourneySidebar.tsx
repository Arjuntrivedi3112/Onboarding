import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { BookMarked, Check, FileText, Library, Map, Search } from "lucide-react";

import { curriculum, lessonPath, sectionPath } from "@/curriculum";
import type { Part, Section } from "@/curriculum/types";
import { useProgress } from "@/hooks/useProgress";
import { cn } from "@/lib/utils";

const REFERENCE_LINKS = [
  { to: "/map", label: "Ecosystem map", icon: Map },
  { to: "/glossary", label: "Glossary", icon: BookMarked },
  { to: "/library", label: "Library", icon: Library },
  { to: "/notes", label: "Session notes", icon: FileText },
];

/**
 * The journey rail.
 *
 * Two levels of hierarchy only: section, then lesson. Parts are headings, not
 * a third interactive level. A section expands to reveal its lessons when it
 * is the one being read, so ~79 lessons never appear at once.
 */
export function JourneySidebar({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { book, hasStarted, isComplete, isVisited, forSection } = useProgress();

  // Which section's lessons are showing. Follows the URL, but stays
  // independently openable so someone can look ahead without navigating.
  const activeSectionId = location.pathname.split("/")[2] ?? null;
  const [openSectionId, setOpenSectionId] = useState<string | null>(activeSectionId);

  useEffect(() => {
    if (activeSectionId) setOpenSectionId(activeSectionId);
  }, [activeSectionId]);

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="border-b border-sidebar-border p-4">
        <Link to="/dashboard" onClick={onNavigate} className="block">
          <span className="font-display text-lg text-foreground">AdTech Journey</span>
        </Link>

        {hasStarted ? (
          <div className="mt-3">
            <div
              role="progressbar"
              aria-valuenow={book.pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={`${book.done} of ${book.total} lessons complete`}
              className="h-1.5 w-full overflow-hidden rounded-full bg-secondary"
            >
              <div className="h-full bg-primary transition-[width] duration-500 ease-out" style={{ width: `${book.pct}%` }} />
            </div>
            <p className="figure mt-2 text-xs text-muted-foreground">
              {book.done} of {book.total} lessons · {book.pct}%
            </p>
          </div>
        ) : (
          <p className="figure mt-2 text-xs text-muted-foreground">
            11 sections · {book.total} lessons
          </p>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="Journey">
        {curriculum.map((part) => (
          <PartGroup
            key={part.id}
            part={part}
            openSectionId={openSectionId}
            onToggleSection={(id) => setOpenSectionId((cur) => (cur === id ? null : id))}
            isComplete={isComplete}
            isVisited={isVisited}
            forSection={forSection}
            onNavigate={onNavigate}
          />
        ))}

        <p className="px-3 pb-2 pt-5 text-xs uppercase text-muted-foreground">Reference</p>
        <ul>
          {REFERENCE_LINKS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
          <li>
            <NavLink
              to="/search"
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                )
              }
            >
              <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
              Search
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
}

function PartGroup({
  part,
  openSectionId,
  onToggleSection,
  isComplete,
  isVisited,
  forSection,
  onNavigate,
}: {
  part: Part;
  openSectionId: string | null;
  onToggleSection: (id: string) => void;
  isComplete: (id: string) => boolean;
  isVisited: (id: string) => boolean;
  forSection: (section: Section) => { done: number; total: number };
  onNavigate?: () => void;
}) {
  return (
    <div className="mb-4">
      <p className="px-3 pb-1.5 text-xs uppercase text-muted-foreground">{part.title}</p>
      <ul>
        {part.sections.map((section) => {
          const { done, total } = forSection(section);
          const open = openSectionId === section.id;
          const finished = done === total;

          return (
            <li key={section.id}>
              <div className="flex items-stretch">
                <NavLink
                  to={sectionPath(section)}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "flex min-w-0 flex-1 items-center gap-2.5 rounded-l-lg py-2 pl-3 pr-1 text-sm transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                    )
                  }
                >
                  <span className="figure w-4 shrink-0 text-xs">
                    {section.bookChapter > 0 ? section.number : "A"}
                  </span>
                  <span className="truncate">{section.title}</span>
                </NavLink>
                <button
                  type="button"
                  onClick={() => onToggleSection(section.id)}
                  aria-expanded={open}
                  aria-label={`${open ? "Hide" : "Show"} lessons in ${section.title}`}
                  className="figure shrink-0 rounded-r-lg px-2.5 text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                >
                  {finished ? (
                    <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  ) : (
                    `${done}/${total}`
                  )}
                </button>
              </div>

              {open && (
                <ul className="mb-1 ml-[1.6rem] border-l border-sidebar-border pl-2">
                  {section.lessons.map((lesson) => {
                    const complete = isComplete(lesson.id);
                    const visited = isVisited(lesson.id);
                    return (
                      <li key={lesson.id}>
                        <NavLink
                          to={lessonPath({ lesson, section, part, index: 0 })}
                          onClick={onNavigate}
                          className={({ isActive }) =>
                            cn(
                              "flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                              isActive
                                ? "bg-sidebar-accent text-foreground"
                                : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                            )
                          }
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                              complete
                                ? "bg-primary"
                                : visited
                                  ? "bg-muted-foreground"
                                  : "border border-border-strong"
                            )}
                          />
                          <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                          {complete && <span className="sr-only">(complete)</span>}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
