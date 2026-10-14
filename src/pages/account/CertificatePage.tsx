import { Link } from "react-router-dom";
import { ArrowRight, Printer } from "lucide-react";

import { bookLessonIds, curriculum, lessonList } from "@/curriculum";
import { useLearnerStats } from "@/hooks/useLearnerData";
import { useProgress, useProgressState } from "@/hooks/useProgress";
import { useAuth } from "@/lib/auth/AuthProvider";
import { SIMULATIONS } from "@/simulations/registry";

/**
 * A printable certificate once every lesson of the book is complete; until
 * then, what's left.
 */
export default function CertificatePage() {
  const { profile } = useAuth();
  const { book } = useProgress();
  const progress = useProgressState();
  const { data: stats } = useLearnerStats();

  const finished = book.done === book.total && book.total > 0;
  const completedAt = bookLessonIds
    .map((id) => progress.completed[id])
    .filter(Boolean)
    .sort()
    .pop();

  if (!finished) {
    const remaining = lessonList.filter((ref) => ref.section.bookChapter > 0 && !progress.completed[ref.lesson.id]);
    return (
      <div>
        <h1 className="font-display text-3xl text-foreground">Your certificate</h1>
        <p className="measure mt-2 text-muted-foreground">
          Finish every lesson in the book to unlock a printable certificate. {remaining.length} to go.
        </p>
        {remaining[0] && (
          <Link
            to={`/learn/${remaining[0].section.id}/${remaining[0].lesson.slug}`}
            className="interactive mt-6 inline-flex min-h-[2.75rem] items-center gap-2 rounded-lg bg-primary px-5 text-primary-foreground hover:bg-primary/90"
          >
            Next: {remaining[0].lesson.title}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    );
  }

  const sections = curriculum.flatMap((p) => p.sections).filter((s) => s.bookChapter > 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
        <h1 className="font-display text-3xl text-foreground">Your certificate</h1>
        <button
          type="button"
          onClick={() => window.print()}
          className="interactive inline-flex min-h-[2.75rem] items-center gap-2 rounded-lg bg-primary px-5 text-primary-foreground hover:bg-primary/90"
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
          Print or save as PDF
        </button>
      </div>

      <article className="mx-auto max-w-3xl rounded-xl border-4 border-double border-primary/60 bg-card p-10 text-center shadow-card print:border-primary print:shadow-none">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">Certificate of completion</p>
        <p className="mt-8 text-muted-foreground">This certifies that</p>
        <p className="mt-2 font-display text-4xl text-foreground">{profile?.full_name || profile?.email}</p>
        <p className="measure mx-auto mt-6 text-muted-foreground">
          completed every lesson of the AdTech Journey — {book.total} lessons across {sections.length} sections, from how an
          impression is served to attribution and building an AdTech platform
          {stats && stats.simsPassed > 0 ? `, and beat ${stats.simsPassed} of ${SIMULATIONS.length} simulator challenges` : ""}.
        </p>
        <p className="figure mt-8 text-sm text-muted-foreground">
          {completedAt ? new Date(completedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : ""}
        </p>
        <p className="mt-10 font-display text-lg text-foreground">AdTech Journey · IQM</p>
      </article>
    </div>
  );
}
