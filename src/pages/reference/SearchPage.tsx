import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { curriculum, lessonList, lessonPath, sectionPath } from "@/curriculum";

/**
 * Search across the journey.
 *
 * Titles and summaries only — lesson bodies are code-split components, so
 * searching their prose would mean downloading all 79 chunks. Matching on the
 * curriculum metadata is honest about what it covers and stays instant.
 */
export default function SearchPage() {
  const [query, setQuery] = useState("");
  const trimmed = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (trimmed.length < 2) return [];
    return lessonList.filter((ref) => {
      const haystack = [
        ref.lesson.title,
        ref.lesson.summary,
        ref.section.title,
        ref.section.summary,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(trimmed);
    });
  }, [trimmed]);

  const sectionResults = useMemo(() => {
    if (trimmed.length < 2) return [];
    return curriculum
      .flatMap((part) => part.sections)
      .filter((section) =>
        `${section.title} ${section.summary}`.toLowerCase().includes(trimmed)
      );
  }, [trimmed]);

  return (
    <div>
      <h1 className="font-display text-3xl text-foreground">Search</h1>
      <p className="measure mt-2 text-muted-foreground">
        Find a lesson by title or topic. For a definition, try the{" "}
        <Link to="/glossary" className="text-primary hover:underline">
          glossary
        </Link>
        .
      </p>

      <label htmlFor="journey-search" className="sr-only">
        Search lessons
      </label>
      <input
        id="journey-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Try: auction, cookies, viewability"
        autoComplete="off"
        className="mt-6 w-full rounded-lg border border-input bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground"
      />

      {trimmed.length >= 2 && (
        <p className="figure mt-4 text-sm text-muted-foreground" aria-live="polite">
          {results.length + sectionResults.length} result
          {results.length + sectionResults.length === 1 ? "" : "s"}
        </p>
      )}

      {sectionResults.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-xs uppercase text-muted-foreground">Sections</h2>
          <ul className="space-y-2">
            {sectionResults.map((section) => (
              <li key={section.id}>
                <Link
                  to={sectionPath(section)}
                  className="block rounded-lg border border-border bg-card p-4 hover:border-border-strong"
                >
                  <span className="block text-foreground">{section.title}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {section.summary}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {results.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-xs uppercase text-muted-foreground">Lessons</h2>
          <ul className="space-y-2">
            {results.map((ref) => (
              <li key={ref.lesson.id}>
                <Link
                  to={lessonPath(ref)}
                  className="block rounded-lg border border-border bg-card p-4 hover:border-border-strong"
                >
                  <span className="figure block text-xs uppercase text-muted-foreground">
                    {ref.section.bookChapter > 0
                      ? `Section ${ref.section.number}`
                      : "Appendix"}{" "}
                    · {ref.section.title}
                  </span>
                  <span className="mt-1 block text-foreground">{ref.lesson.title}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {ref.lesson.summary}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {trimmed.length >= 2 && results.length === 0 && sectionResults.length === 0 && (
        <div className="mt-8 rounded-lg border border-border bg-card p-6">
          <p className="text-foreground">Nothing matched "{query.trim()}".</p>
          <Link to="/glossary" className="mt-3 inline-block text-primary hover:underline">
            Look it up in the glossary
          </Link>
        </div>
      )}
    </div>
  );
}
