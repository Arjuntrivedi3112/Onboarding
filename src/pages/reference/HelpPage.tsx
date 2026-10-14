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
            In your account. It's saved as you go and follows you to any device you sign in on. If
            you're offline, changes wait on this device and sync when you're back.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl text-foreground">What your onboarding lead can see</h2>
          <p className="mb-2">
            Admins use the platform to help new people along, so they can see: which lessons you've
            opened and finished, roughly how long you've spent reading, your self-check ratings,
            simulator challenges, badges, the questions you ask the assistant, and lesson feedback.
          </p>
          <p>
            They can't see your lesson notes — those are private to you — or your password or
            recovery code.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl text-foreground">Forgot your password?</h2>
          <p>
            No emails are involved. On the sign-in page choose <em>Forgot password</em> and enter
            the recovery code you saved when you first signed in. Lost that too? Choose{" "}
            <em>I lost my code</em> and an admin will give you a temporary password. You can make a new
            recovery code any time from your{" "}
            <Link to="/profile" className="text-primary hover:underline">
              profile
            </Link>
            .
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
