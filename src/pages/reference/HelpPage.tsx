import { Link } from "react-router-dom";

import { bookTotalLessons, bookTotalMinutes } from "@/curriculum";
import { useProgress } from "@/hooks/useProgress";

export default function HelpPage() {
  const { state, book, resetProgress } = useProgress();

  const confirmReset = () => {
    const message =
      book.done > 0
        ? `Reset progress? This clears ${book.done} completed lessons. It cannot be undone.`
        : "Reset progress? Nothing is marked complete yet.";
    if (window.confirm(message)) resetProgress();
  };

  return (
    <div>
      <h1 className="font-display text-3xl text-foreground">How this works</h1>

      <div className="measure mt-6 space-y-6 text-muted-foreground">
        <section>
          <h2 className="mb-2 text-xl text-foreground">What this is</h2>
          <p>
            The AdTech book turned into {bookTotalLessons} lessons across 11 sections, in the book's
            own order. Section numbers match chapter numbers, so section 5 is chapter 5. Reading
            every word takes about {Math.round(bookTotalMinutes / 60)} hours.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl text-foreground">How progress is counted</h2>
          <p>
            You mark a lesson complete yourself, and you can unmark it at any time. The percentage
            is weighted by how long each lesson takes, so a 12-minute lesson moves the bar further
            than a 5-minute one. Only the 11 book sections count toward it — the AI appendix sits
            outside the total, so finishing the book reads 100%.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl text-foreground">Where your progress lives</h2>
          <p>
            In this browser, on this device. Nothing is sent anywhere and nobody else can see it.
            Clearing your browser data clears it, and it will not follow you to another machine.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl text-foreground">Reset</h2>
          <p className="mb-3">
            {book.done > 0
              ? `${book.done} of ${book.total} lessons are marked complete.`
              : "Nothing is marked complete yet."}
          </p>
          <button
            type="button"
            onClick={confirmReset}
            className="inline-flex min-h-[2.75rem] items-center rounded-lg border border-border-strong px-4 text-sm text-foreground hover:bg-secondary"
          >
            Reset progress
          </button>
        </section>
      </div>

      <Link to="/dashboard" className="mt-8 inline-block text-primary hover:underline">
        Back to the dashboard
      </Link>
    </div>
  );
}
