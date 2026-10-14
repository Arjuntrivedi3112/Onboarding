import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Check, Clock, Lightbulb, Link2, MessageSquare, Sparkles, Target, Trophy } from "lucide-react";
import { toast } from "sonner";

import { openAskPanel } from "@/components/ai/askBus";
import { curriculum, findLesson, findSection, lessonPath } from "@/curriculum";
import { useSimProgress } from "@/hooks/useSimProgress";
import { cn } from "@/lib/utils";
import { simulationById } from "@/simulations/registry";
import type { SimulationProps } from "@/simulations/types";

/**
 * One simulator, framed by the same shell every time: what you'll see, a
 * guided "try this" list, the challenge, related lessons, and a button that
 * asks the AI assistant to explain the exact state on screen.
 */
export default function SimulationPage() {
  const { simId } = useParams<{ simId: string }>();
  const sim = simulationById(simId);
  const { progress, recordOpen, recordPass } = useSimProgress();
  const [description, setDescription] = useState("");
  const [tried, setTried] = useState<Record<number, boolean>>({});
  const [showHint, setShowHint] = useState(false);
  const opened = useRef<string | null>(null);

  const Component = useMemo(() => (sim ? lazy(sim.load) : null), [sim]);

  useEffect(() => {
    if (!sim || opened.current === sim.id) return;
    opened.current = sim.id;
    void recordOpen(sim.id);
    setTried({});
    setShowHint(false);
  }, [sim, recordOpen]);

  const passed = Boolean(sim && progress[sim.id]?.challenge_passed_at);

  const onChallengePassed = useCallback(() => {
    if (!sim) return;
    void recordPass(sim.id);
    toast.success(`Challenge beaten: ${sim.challenge.title}`, {
      description: "Nice work. It's saved to your profile.",
    });
  }, [sim, recordPass]);

  const onDescribe = useCallback((d: string) => setDescription(d), []);

  if (!sim || !Component) return <Navigate to="/lab" replace />;

  const section = findSection(curriculum, sim.sectionId);
  const lessons = sim.relatedLessonIds.map((id) => findLesson(curriculum, id)).filter(Boolean);

  const explain = () => {
    openAskPanel(
      `I'm in the "${sim.title}" simulator. Here's what I'm looking at: ${description || "the starting state"}. Can you explain what is happening and why, in simple terms?`
    );
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied", { description: "It opens this simulator with your current settings." });
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  const props: SimulationProps = { onChallengePassed, challengePassed: passed, onDescribe };

  return (
    <div>
      <div>
        <Link to="/lab" className="inline-flex items-center gap-1.5 text-xs uppercase text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Simulation Lab
          {section && ` · ${section.bookChapter > 0 ? `Section ${section.number}` : "Appendix"} · ${section.title}`}
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl text-foreground">{sim.title}</h1>
            <p className="measure mt-1 text-muted-foreground">{sim.tagline}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="figure inline-flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" aria-hidden="true" />~{sim.minutes} min
            </span>
            <span className="rounded-full border border-border px-2.5 py-0.5 text-sm text-muted-foreground">{sim.difficulty}</span>
            {passed && (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-sm text-primary">
                <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
                Challenge beaten
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <Suspense
            fallback={
              <div className="flex h-80 items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground" role="status">
                Loading simulator…
              </div>
            }
          >
            <Component {...props} />
          </Suspense>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={explain}
              className="interactive inline-flex min-h-[2.5rem] items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm text-foreground hover:border-primary/40"
            >
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              Explain what I'm seeing
            </button>
            <button
              type="button"
              onClick={share}
              className="interactive inline-flex min-h-[2.5rem] items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm text-muted-foreground hover:text-foreground"
            >
              <Link2 className="h-4 w-4" aria-hidden="true" />
              Copy link
            </button>
          </div>
        </div>

        <aside className="space-y-4">
          <section className={cn("rounded-lg border bg-card p-4", passed ? "border-primary/40" : "border-border")}>
            <h2 className="flex items-center gap-2 text-sm uppercase text-muted-foreground">
              <Target className="h-4 w-4" aria-hidden="true" />
              Challenge
            </h2>
            <p className="mt-2 text-base text-foreground">{sim.challenge.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{sim.challenge.description}</p>
            {passed ? (
              <motion.p
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary"
              >
                <Trophy className="h-4 w-4" aria-hidden="true" />
                Beaten — keep experimenting.
              </motion.p>
            ) : (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowHint((v) => !v)}
                  aria-expanded={showHint}
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Lightbulb className="h-4 w-4" aria-hidden="true" />
                  {showHint ? "Hide hint" : "Need a hint?"}
                </button>
                {showHint && <p className="mt-2 text-sm text-muted-foreground">{sim.challenge.hint}</p>}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm uppercase text-muted-foreground">Try this</h2>
            <ol className="mt-3 space-y-2">
              {sim.tryThis.map((step, i) => (
                <li key={step}>
                  <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(tried[i])}
                      onChange={(e) => setTried((t) => ({ ...t, [i]: e.target.checked }))}
                      className="mt-0.5 h-4 w-4 accent-primary"
                    />
                    <span className={tried[i] ? "text-muted-foreground line-through" : "text-foreground"}>{step}</span>
                  </label>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm uppercase text-muted-foreground">What you'll see</h2>
            <ul className="mt-3 space-y-2">
              {sim.whatYoullSee.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {lessons.length > 0 && (
            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="flex items-center gap-2 text-sm uppercase text-muted-foreground">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                Read the lessons
              </h2>
              <ul className="mt-3 space-y-1">
                {lessons.map((ref) => (
                  <li key={ref!.lesson.id}>
                    <Link
                      to={lessonPath(ref!)}
                      className="block rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-secondary"
                    >
                      {ref!.lesson.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="flex items-start gap-2 px-1 text-xs text-muted-foreground">
            <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Stuck? "Explain what I'm seeing" sends the simulator's current state to the assistant.
          </p>
        </aside>
      </div>
    </div>
  );
}
