import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Briefcase,
  Calculator,
  Code2,
  Compass,
  Database,
  FlaskConical,
  Handshake,
  Layers,
  MessageSquare,
  NotebookPen,
  Trophy,
  Users,
} from "lucide-react";

import { ThemeToggle } from "@/components/journey/ThemeToggle";
import { curriculum, lessonList } from "@/curriculum";
import type { Json } from "@/integrations/supabase/types";
import { firstNameFor, useAuth } from "@/lib/auth/AuthProvider";
import {
  buildLearningPath,
  finishDate,
  parseLearningPath,
  pathMinutes,
  TEAMS,
  weeksToFinish,
  type Comfort,
  type Team,
} from "@/lib/learningPath";
import { track } from "@/lib/telemetry";
import { cn } from "@/lib/utils";

const TEAM_ICONS: Record<Team, typeof Users> = {
  Sales: Handshake,
  "Account Management": Users,
  AdOps: Layers,
  Engineering: Code2,
  Product: Compass,
  Data: Database,
  Finance: Calculator,
  Other: Briefcase,
};

const COMFORT_LEVELS = [
  { value: 1, label: "New to me" },
  { value: 2, label: "Heard of it" },
  { value: 4, label: "Comfortable" },
  { value: 5, label: "Could teach it" },
];

const PACES = [
  { minutes: 30, label: "Light", detail: "30 min a week" },
  { minutes: 60, label: "Steady", detail: "1 hour a week" },
  { minutes: 120, label: "Focused", detail: "2 hours a week" },
  { minutes: 240, label: "Sprint", detail: "4 hours a week" },
];

const STEPS = ["Welcome", "About you", "What you know", "Your pace", "Your path"] as const;

/**
 * First-run onboarding: who you are, what you already know and how much
 * time you have become a personalised path and a finish date. Can be re-run
 * any time from the profile to rebuild the path.
 */
export default function Welcome() {
  const { profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const rerun = Boolean(profile?.onboarding_completed_at);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [team, setTeam] = useState<Team | null>((TEAMS as readonly string[]).includes(profile?.team ?? "") ? (profile!.team as Team) : null);
  const [comfort, setComfort] = useState<Comfort>(() => {
    const stored = profile?.comfort as Record<string, number> | null;
    return stored && typeof stored === "object" ? stored : {};
  });
  const [weekly, setWeekly] = useState<number>(profile?.weekly_minutes_goal ?? 60);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const path = useMemo(() => buildLearningPath(team, comfort), [team, comfort]);
  const minutes = pathMinutes(path);
  const weeks = weeksToFinish(minutes, weekly);
  const finish = finishDate(weeks).toLocaleDateString(undefined, { month: "long", day: "numeric" });
  const sections = curriculum.flatMap((p) => p.sections);
  const name = firstNameFor(profile ? { ...profile, full_name: fullName || profile.full_name } : null);

  const canContinue = step !== 1 || (fullName.trim().length > 0 && team !== null);

  const go = (delta: number) => {
    setDirection(delta);
    setStep((s) => Math.max(0, Math.min(STEPS.length - 1, s + delta)));
  };

  const finishOnboarding = async () => {
    setSaving(true);
    setError(null);
    try {
      const previous = parseLearningPath(profile?.learning_path);
      await updateProfile({
        full_name: fullName.trim(),
        team,
        comfort: comfort as Json,
        experience_level: Object.values(comfort).some((v) => v >= 4) ? "experienced" : "new",
        weekly_minutes_goal: weekly,
        learning_path: path as unknown as Json,
        onboarding_completed_at: profile?.onboarding_completed_at ?? new Date().toISOString(),
      });
      if (!rerun) track("onboarding_complete", { meta: { team, weekly } });
      navigate("/dashboard", { replace: true, state: { pathUpdated: Boolean(previous) } });
    } catch {
      setError("Couldn't save your answers. Check your connection and try again.");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ThemeToggle />
      <main id="main" className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-10 sm:px-6">
        <div className="flex items-center justify-between">
          <span className="font-display text-lg text-foreground">AdTech Journey</span>
          {rerun && (
            <button type="button" onClick={() => navigate("/profile")} className="text-sm text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          )}
        </div>

        <ol className="mt-8 flex gap-2" aria-label="Onboarding progress">
          {STEPS.map((label, i) => (
            <li key={label} className="flex-1">
              <span className={cn("block h-1.5 rounded-full transition-colors duration-300", i <= step ? "bg-primary" : "bg-secondary")} />
              <span className={cn("mt-2 hidden text-xs sm:block", i === step ? "text-foreground" : "text-muted-foreground")}>
                {label}
              </span>
              <span className="sr-only">{i < step ? "done" : i === step ? "current step" : ""}</span>
            </li>
          ))}
        </ol>

        <div className="relative mt-10 flex-1">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.section
              key={step}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              aria-labelledby="step-title"
            >
              {step === 0 && (
                <div>
                  <h1 id="step-title" className="font-display text-4xl text-foreground">
                    {name ? `Welcome, ${name}.` : "Welcome."}
                  </h1>
                  <p className="measure mt-4 text-lg text-muted-foreground">
                    You're about to learn how advertising technology actually works — from the 100-millisecond
                    auction behind every ad to how campaigns are measured. Two minutes of setup and we'll build
                    a path that fits your role.
                  </p>
                  <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                    {[
                      { icon: BookOpen, title: `${lessonList.length} short lessons`, body: "The whole AdTech book in bite-sized reads, plus an AI appendix." },
                      { icon: FlaskConical, title: "12 hands-on simulators", body: "Run an auction, build an identity graph, pace a budget." },
                      { icon: MessageSquare, title: "An AI explainer", body: "Ask anything; it answers from the book first." },
                      { icon: Trophy, title: "Streaks, badges and a certificate", body: "See your progress add up as you go." },
                    ].map(({ icon: Icon, title, body }, i) => (
                      <motion.li
                        key={title}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.08 }}
                        className="rounded-lg border border-border bg-card p-4"
                      >
                        <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                        <p className="mt-2 text-foreground">{title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}

              {step === 1 && (
                <div>
                  <h1 id="step-title" className="font-display text-3xl text-foreground">
                    A little about you
                  </h1>
                  <p className="mt-2 text-muted-foreground">Your team decides which sections we put first.</p>
                  <div className="mt-6 space-y-1.5">
                    <label htmlFor="onb-name" className="text-sm text-foreground">
                      What should we call you?
                    </label>
                    <input
                      id="onb-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      autoComplete="name"
                      className="interactive flex h-11 w-full max-w-sm rounded-lg border border-input bg-card px-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <fieldset className="mt-6">
                    <legend className="text-sm text-foreground">Which team are you joining?</legend>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {TEAMS.map((t) => {
                        const Icon = TEAM_ICONS[t];
                        return (
                          <button
                            key={t}
                            type="button"
                            aria-pressed={team === t}
                            onClick={() => setTeam(t)}
                            className={cn(
                              "interactive flex min-h-[5.5rem] flex-col items-center justify-center gap-2 rounded-lg border p-3 text-center text-sm",
                              team === t
                                ? "border-primary bg-primary/10 text-foreground"
                                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                            )}
                          >
                            <Icon className={cn("h-5 w-5", team === t ? "text-primary" : "")} aria-hidden="true" />
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h1 id="step-title" className="font-display text-3xl text-foreground">
                    What do you already know?
                  </h1>
                  <p className="mt-2 text-muted-foreground">
                    Be honest — anything you know well becomes a quick skim, never a skip.
                  </p>
                  <ul className="mt-6 space-y-4">
                    {curriculum.map((part) => (
                      <li key={part.id} className="rounded-lg border border-border bg-card p-4">
                        <p className="text-foreground">{part.title.replace(/^Part [IVX]+ — /, "").replace(/^Appendix — /, "")}</p>
                        <p className="text-sm text-muted-foreground">{part.sections.map((s) => s.title).join(" · ")}</p>
                        <div role="radiogroup" aria-label={`Comfort with ${part.title}`} className="mt-3 flex flex-wrap gap-2">
                          {COMFORT_LEVELS.map((level) => {
                            const selected = (comfort[part.id] ?? 2) === level.value;
                            return (
                              <button
                                key={level.value}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                onClick={() => setComfort((c) => ({ ...c, [part.id]: level.value }))}
                                className={cn(
                                  "interactive min-h-[2.25rem] rounded-full border px-3 text-sm",
                                  selected ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"
                                )}
                              >
                                {level.label}
                              </button>
                            );
                          })}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h1 id="step-title" className="font-display text-3xl text-foreground">
                    How much time can you give it?
                  </h1>
                  <p className="mt-2 text-muted-foreground">We'll track this as your weekly goal. Change it any time.</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {PACES.map((pace) => {
                      const w = weeksToFinish(minutes, pace.minutes);
                      return (
                        <button
                          key={pace.minutes}
                          type="button"
                          aria-pressed={weekly === pace.minutes}
                          onClick={() => setWeekly(pace.minutes)}
                          className={cn(
                            "interactive rounded-lg border p-4 text-left",
                            weekly === pace.minutes ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"
                          )}
                        >
                          <span className="block text-lg text-foreground">{pace.label}</span>
                          <span className="block text-sm text-muted-foreground">{pace.detail}</span>
                          <span className="figure mt-3 block text-sm text-primary">
                            ≈ {w} {w === 1 ? "week" : "weeks"} to finish
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <h1 id="step-title" className="font-display text-3xl text-foreground">
                    Your path
                  </h1>
                  <p className="mt-2 text-muted-foreground">
                    About {Math.round(minutes / 60)} hours of reading. At {weekly} minutes a week you'll finish around{" "}
                    <span className="text-foreground">{finish}</span>.
                  </p>
                  <ol className="mt-6 space-y-2">
                    {path.order.map((id, i) => {
                      const s = sections.find((x) => x.id === id)!;
                      const focus = path.focus[id];
                      const Icon = s.icon;
                      return (
                        <motion.li
                          key={id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
                        >
                          <span className="figure w-5 text-sm text-muted-foreground">{i + 1}</span>
                          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                          <span className="min-w-0 flex-1 truncate text-foreground">{s.title}</span>
                          {focus === "core" && (
                            <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                              Key for {team}
                            </span>
                          )}
                          {focus === "skim" && (
                            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">Skim</span>
                          )}
                        </motion.li>
                      );
                    })}
                  </ol>
                  <ul className="mt-6 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                    <li className="flex gap-2">
                      <FlaskConical className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      Every section has a simulator in the Lab.
                    </li>
                    <li className="flex gap-2">
                      <NotebookPen className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      Take private notes on any lesson.
                    </li>
                    <li className="flex gap-2">
                      <BarChart3 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      Progress is saved to your account on every device.
                    </li>
                    <li className="flex gap-2">
                      <Users className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      Your onboarding lead can see your progress to help — never your notes.
                    </li>
                  </ul>
                </div>
              )}
            </motion.section>
          </AnimatePresence>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-6">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => go(-1)}
              className="interactive inline-flex min-h-[2.75rem] items-center gap-2 rounded-lg px-4 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => go(1)}
              disabled={!canContinue}
              className="interactive inline-flex min-h-[2.75rem] items-center gap-2 rounded-lg bg-primary px-5 text-base text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {step === 0 ? "Build my path" : "Continue"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={finishOnboarding}
              disabled={saving}
              className="interactive inline-flex min-h-[2.75rem] items-center gap-2 rounded-lg bg-primary px-5 text-base text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? "Saving…" : rerun ? "Save my path" : "Start learning"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
