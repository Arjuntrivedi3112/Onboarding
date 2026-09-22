import { Link } from "react-router-dom";
import { Star } from "lucide-react";

import { lessonPath } from "@/curriculum";
import { useProgress } from "@/hooks/useProgress";

/**
 * A personal quick-reference list — separate from linear progress. Starring
 * a lesson says nothing about whether it's been read or completed; it's
 * just "I want to find this again quickly."
 */
export default function BookmarksPage() {
  const { bookmarkedLessons, isComplete, toggleBookmark } = useProgress();

  return (
    <div>
      <h1 className="font-display text-3xl text-foreground">Bookmarks</h1>
      <p className="measure mt-2 text-muted-foreground">
        Lessons you've starred for quick reference, newest first. This is separate from your
        progress — bookmarking something doesn't mark it complete.
      </p>

      {bookmarkedLessons.length === 0 ? (
        <div className="mt-8 rounded-lg border border-border bg-card p-6">
          <p className="text-foreground">Nothing bookmarked yet.</p>
          <p className="measure mt-2 text-sm text-muted-foreground">
            Open the star icon next to any lesson's title to add it here.
          </p>
        </div>
      ) : (
        <ol className="mt-8 space-y-2">
          {bookmarkedLessons.map((ref) => (
            <li key={ref.lesson.id}>
              <div className="interactive shadow-card flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:border-primary/40">
                <Link to={lessonPath(ref)} className="min-w-0 flex-1">
                  <span className="block text-xs uppercase text-muted-foreground">
                    {ref.section.bookChapter > 0 ? `Section ${ref.section.number} · ` : "Appendix · "}
                    {ref.section.title}
                  </span>
                  <span className="mt-0.5 block text-foreground">{ref.lesson.title}</span>
                </Link>
                <span className="figure shrink-0 text-xs text-muted-foreground">
                  {isComplete(ref.lesson.id) ? "Done" : `~${ref.lesson.minutes} min`}
                </span>
                <button
                  type="button"
                  onClick={() => toggleBookmark(ref.lesson.id)}
                  aria-label={`Remove bookmark: ${ref.lesson.title}`}
                  className="interactive -m-2 shrink-0 rounded-lg p-2 text-muted-foreground hover:text-foreground"
                >
                  <Star className="h-4 w-4 fill-primary text-primary" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
