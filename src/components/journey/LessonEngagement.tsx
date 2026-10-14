import { useEffect, useRef, useState } from "react";
import { Check, NotebookPen, ThumbsDown, ThumbsUp } from "lucide-react";

import { useLessonFeedback, useLessonNote, type SelfRating } from "@/hooks/useLessonEngagement";
import { cn } from "@/lib/utils";

const RATINGS: Array<{ id: SelfRating; label: string }> = [
  { id: "got_it", label: "Got it" },
  { id: "partly", label: "Partly" },
  { id: "missed", label: "Missed it" },
];

/** "How did you do?" after revealing a self-check answer. */
export function SelfCheckRating({
  value,
  onRate,
}: {
  value: SelfRating | undefined;
  onRate: (rating: SelfRating) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
      <span className="text-sm text-muted-foreground">How did you do?</span>
      <div role="group" aria-label="Rate your answer" className="flex flex-wrap gap-2">
        {RATINGS.map((r) => (
          <button
            key={r.id}
            type="button"
            aria-pressed={value === r.id}
            onClick={() => onRate(r.id)}
            className={cn(
              "interactive inline-flex min-h-[2.25rem] items-center gap-1.5 rounded-full border px-3 text-sm",
              value === r.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-foreground hover:border-primary/40"
            )}
          >
            {value === r.id && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Thumbs up/down plus an optional comment, at the end of every lesson. */
export function LessonFeedback({ lessonId }: { lessonId: string }) {
  const { feedback, save, saving } = useLessonFeedback(lessonId);
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (feedback) {
      setHelpful(feedback.helpful);
      setComment(feedback.comment ?? "");
    }
  }, [feedback]);

  const choose = async (value: boolean) => {
    setHelpful(value);
    setSent(false);
    await save({ helpful: value, comment: comment.trim() || null });
  };

  const sendComment = async () => {
    if (helpful === null) return;
    await save({ helpful, comment: comment.trim() || null });
    setSent(true);
  };

  return (
    <section className="mb-10 rounded-lg border border-border bg-card p-5" aria-labelledby={`feedback-${lessonId}`}>
      <h2 id={`feedback-${lessonId}`} className="text-base text-foreground">
        Was this lesson helpful?
      </h2>
      <div className="mt-3 flex gap-2">
        {[
          { value: true, label: "Yes", icon: ThumbsUp },
          { value: false, label: "Not really", icon: ThumbsDown },
        ].map(({ value, label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            aria-pressed={helpful === value}
            onClick={() => void choose(value)}
            className={cn(
              "interactive inline-flex min-h-[2.5rem] items-center gap-2 rounded-lg border px-4 text-sm",
              helpful === value
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      {helpful !== null && (
        <div className="mt-4">
          <label htmlFor={`feedback-comment-${lessonId}`} className="text-sm text-muted-foreground">
            {helpful ? "Anything that worked especially well? (optional)" : "What was unclear or missing? (optional)"}
          </label>
          <textarea
            id={`feedback-comment-${lessonId}`}
            value={comment}
            maxLength={2000}
            onChange={(e) => {
              setComment(e.target.value);
              setSent(false);
            }}
            rows={2}
            className="mt-1.5 w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => void sendComment()}
              disabled={saving || !comment.trim()}
              className="interactive inline-flex min-h-[2.25rem] items-center rounded-lg border border-border px-3 text-sm text-foreground hover:border-primary/40 disabled:opacity-60"
            >
              Send
            </button>
            {sent && (
              <span role="status" className="text-sm text-muted-foreground">
                Thanks — the team reads every comment.
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/** Private per-lesson notes that autosave. Admins can't read these. */
export function LessonNotes({ lessonId }: { lessonId: string }) {
  const { note, loaded, save, error } = useLessonNote(lessonId);
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    if (!loaded || hydrated.current) return;
    hydrated.current = true;
    setBody(note?.body ?? "");
    if (note?.body) setOpen(true);
  }, [loaded, note]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const onChange = (value: string) => {
    setBody(value);
    setState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await save(value);
        setState("saved");
      } catch {
        setState("idle");
      }
    }, 800);
  };

  return (
    <section className="mb-10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="interactive inline-flex min-h-[2.5rem] items-center gap-2 rounded-lg border border-border px-4 text-sm text-foreground hover:border-primary/40"
      >
        <NotebookPen className="h-4 w-4" aria-hidden="true" />
        {open ? "Hide my notes" : note?.body ? "My notes" : "Add a note"}
      </button>
      {open && (
        <div className="mt-3">
          <label htmlFor={`notes-${lessonId}`} className="sr-only">
            My notes for this lesson
          </label>
          <textarea
            id={`notes-${lessonId}`}
            value={body}
            onChange={(e) => onChange(e.target.value)}
            rows={5}
            maxLength={20000}
            placeholder="Your own words, questions to ask, how this applies to your work… Only you can see these."
            className="w-full rounded-lg border border-input bg-card p-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="mt-1 text-xs text-muted-foreground" role="status">
            {error ? "Couldn't save — check your connection." : state === "saving" ? "Saving…" : state === "saved" ? "Saved" : "Private to you"}
          </p>
        </div>
      )}
    </section>
  );
}
