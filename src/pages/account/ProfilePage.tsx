import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Award, BookOpen, Clock, Flame, FlaskConical, KeyRound, Lock, Route, ShieldCheck, Trophy } from "lucide-react";
import { toast } from "sonner";

import { RecoveryCodePanel } from "@/components/auth/RecoveryCodePanel";
import { FormError, PasswordField, PasswordStrength } from "@/components/auth/fields";
import { BADGE_ICONS } from "@/components/dashboard/cards";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useLearnerStats } from "@/hooks/useLearnerData";
import { useProgress } from "@/hooks/useProgress";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { initialsFor, useAuth } from "@/lib/auth/AuthProvider";
import { friendlyAuthError } from "@/lib/auth/errors";
import { TEAMS } from "@/lib/learningPath";
import { resetProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { SIMULATIONS } from "@/simulations/registry";

const PACES = [30, 60, 120, 240];

/** The learner's own account: progress at a glance, badges, settings and security. */
export default function ProfilePage() {
  const { profile, isAdmin, updateProfile, refreshProfile } = useAuth();
  const { book } = useProgress();
  const { data: stats } = useLearnerStats();
  const [name, setName] = useState(profile?.full_name ?? "");
  const [team, setTeam] = useState(profile?.team ?? "");
  const [pace, setPace] = useState(profile?.weekly_minutes_goal ?? 60);
  const [savingProfile, setSavingProfile] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwBusy, setPwBusy] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [cohortName, setCohortName] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.cohort_id) return;
    void supabase
      .from("cohorts")
      .select("name")
      .eq("id", profile.cohort_id)
      .maybeSingle()
      .then(({ data }) => setCohortName(data?.name ?? null));
  }, [profile?.cohort_id]);

  if (!profile) return null;
  const earned = new Set(stats?.badges.map((b) => b.badge_id) ?? []);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({ full_name: name.trim() || null, team: team || null, weekly_minutes_goal: pace });
      toast.success("Profile saved");
    } catch {
      toast.error("Couldn't save your profile");
    }
    setSavingProfile(false);
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 8) return setPwError("Use at least 8 characters.");
    if (password !== confirm) return setPwError("Passwords don't match.");
    setPwBusy(true);
    setPwError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setPwBusy(false);
    if (error) return setPwError(friendlyAuthError(error));
    setPassword("");
    setConfirm("");
    toast.success("Password changed");
  };

  const reset = () => {
    if (window.confirm("Reset all your lesson progress and bookmarks? Notes and badges are kept. This can't be undone.")) {
      resetProgress();
      toast.success("Progress reset");
    }
  };

  return (
    <div>
      <header className="flex flex-wrap items-center gap-4">
        <span className="figure flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl text-primary-foreground" aria-hidden="true">
          {initialsFor(profile)}
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-3xl text-foreground">{profile.full_name || profile.email}</h1>
          <p className="text-muted-foreground">
            {profile.email}
            {profile.team && ` · ${profile.team}`}
            {cohortName && ` · ${cohortName}`}
            {isAdmin && " · Admin"}
          </p>
        </div>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5" aria-label="Your stats">
        {[
          { icon: BookOpen, label: "Lessons", value: `${book.done}/${book.total}` },
          { icon: Clock, label: "Reading time", value: `${Math.round((stats?.totalMinutes ?? 0) / 6) / 10} h` },
          { icon: FlaskConical, label: "Challenges", value: `${stats?.simsPassed ?? 0}/${SIMULATIONS.length}` },
          { icon: Flame, label: "Streak", value: `${stats?.streak ?? 0} d` },
          { icon: Award, label: "Badges", value: `${earned.size}/${ACHIEVEMENTS.length}` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-lg border border-border bg-card p-4">
            <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
            <p className="figure mt-2 text-2xl text-foreground">{value}</p>
            <p className="text-xs uppercase text-muted-foreground">{label}</p>
          </div>
        ))}
      </section>

      {book.done === book.total && (
        <Link
          to="/certificate"
          className="interactive mt-4 flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/10 p-4 text-foreground hover:bg-primary/15"
        >
          <Trophy className="h-5 w-5 text-primary" aria-hidden="true" />
          You've finished the book — view your certificate
        </Link>
      )}

      <section className="mt-10">
        <h2 className="text-xl text-foreground">Badges</h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {ACHIEVEMENTS.map((a) => {
            const Icon = BADGE_ICONS[a.icon];
            const has = earned.has(a.id);
            return (
              <li
                key={a.id}
                className={cn("rounded-lg border p-4", has ? "border-primary/30 bg-card" : "border-dashed border-border bg-transparent")}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    has ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                  )}
                  aria-hidden="true"
                >
                  {has ? <Icon className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                </span>
                <p className={cn("mt-3 text-sm", has ? "text-foreground" : "text-muted-foreground")}>{a.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{a.description}</p>
                <span className="sr-only">{has ? "Earned" : "Not earned yet"}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-lg text-foreground">About you</h2>
          <form onSubmit={saveProfile} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="pf-name" className="text-sm text-foreground">
                Name
              </label>
              <input
                id="pf-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="pf-team" className="text-sm text-foreground">
                Team
              </label>
              <select
                id="pf-team"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Not set</option>
                {TEAMS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <fieldset>
              <legend className="text-sm text-foreground">Weekly goal</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {PACES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={pace === m}
                    onClick={() => setPace(m)}
                    className={cn(
                      "interactive min-h-[2.25rem] rounded-full border px-3 text-sm",
                      pace === m ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {m < 60 ? `${m} min` : `${m / 60} h`}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={savingProfile}
                className="interactive inline-flex min-h-[2.5rem] items-center rounded-lg bg-primary px-4 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {savingProfile ? "Saving…" : "Save"}
              </button>
              <Link
                to="/welcome"
                className="interactive inline-flex min-h-[2.5rem] items-center gap-2 rounded-lg border border-border px-4 text-sm text-foreground hover:border-primary/40"
              >
                <Route className="h-4 w-4" aria-hidden="true" />
                Rebuild my path
              </Link>
            </div>
          </form>
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-lg text-foreground">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            Password and recovery
          </h2>
          <form onSubmit={changePassword} className="mt-4 space-y-4" noValidate>
            <FormError>{pwError}</FormError>
            <div>
              <PasswordField label="New password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <PasswordStrength password={password} />
            </div>
            <PasswordField label="Confirm new password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <button
              type="submit"
              disabled={pwBusy || !password}
              className="interactive inline-flex min-h-[2.5rem] items-center rounded-lg bg-primary px-4 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {pwBusy ? "Changing…" : "Change password"}
            </button>
          </form>
          <div className="mt-6 border-t border-border pt-5">
            <p className="text-sm text-foreground">Recovery code</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {profile.recovery_code_saved_at
                ? `Saved ${new Date(profile.recovery_code_saved_at).toLocaleDateString()}. Lost it? Make a new one — the old one stops working.`
                : "You don't have a saved recovery code."}
            </p>
            <button
              type="button"
              onClick={() => setCodeOpen(true)}
              className="interactive mt-3 inline-flex min-h-[2.5rem] items-center gap-2 rounded-lg border border-border px-4 text-sm text-foreground hover:border-primary/40"
            >
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              Generate a new recovery code
            </button>
          </div>
        </section>
      </div>

      <section className="mt-10 rounded-lg border border-destructive/30 p-5">
        <h2 className="text-lg text-foreground">Start over</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Clears lesson progress and bookmarks on every device. Your notes and badges stay.
        </p>
        <button
          type="button"
          onClick={reset}
          className="interactive mt-3 inline-flex min-h-[2.5rem] items-center rounded-lg border border-destructive/50 px-4 text-sm text-destructive hover:bg-destructive/10"
        >
          Reset my progress
        </button>
      </section>

      <Dialog open={codeOpen} onOpenChange={setCodeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New recovery code</DialogTitle>
            <DialogDescription>Your previous code no longer works once this one is shown.</DialogDescription>
          </DialogHeader>
          {codeOpen && (
            <RecoveryCodePanel
              email={profile.email}
              confirmLabel="Done"
              onSaved={async () => {
                await refreshProfile();
                setCodeOpen(false);
                toast.success("Recovery code saved");
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
