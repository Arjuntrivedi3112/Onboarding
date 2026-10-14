import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ClipboardList, KeyRound, Send, Trash2, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";

import {
  AssignDialog,
  Card,
  CredentialsDialog,
  EmptyState,
  Kpi,
  NudgeDialog,
  PctBar,
  RiskChips,
  buttonClass,
  inputClass,
  relativeTime,
} from "@/components/admin/ui";
import { assignmentTarget } from "@/components/dashboard/cards";
import { curriculum, findLesson } from "@/curriculum";
import { useAdminActions, useLearners, usePersonDetail } from "@/lib/admin/api";
import { useAuth } from "@/lib/auth/AuthProvider";
import { parseLearningPath } from "@/lib/learningPath";
import { cn } from "@/lib/utils";
import { SIMULATIONS } from "@/simulations/registry";

const EVENT_LABELS: Record<string, string> = {
  login: "Signed in",
  lesson_view: "Opened",
  lesson_complete: "Completed",
  lesson_uncomplete: "Un-completed",
  sim_open: "Opened simulator",
  sim_pass: "Beat simulator challenge",
  search: "Searched",
  bookmark: "Bookmarked",
  self_check: "Rated a self-check on",
  feedback: "Left feedback on",
  badge: "Earned a badge",
  onboarding_complete: "Finished onboarding",
  tour_complete: "Finished the product tour",
};

export default function PersonPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const { learners, cohorts } = useLearners();
  const { data, isLoading } = usePersonDetail(userId);
  const actions = useAdminActions();
  const [dialog, setDialog] = useState<"assign" | "nudge" | null>(null);
  const [credentials, setCredentials] = useState<Array<{ email: string; password: string }>>([]);

  const learner = learners.find((l) => l.user.id === userId);
  if (isLoading || !learner) return <p className="text-muted-foreground">{isLoading ? "Loading…" : "Person not found."}</p>;
  const u = learner.user;
  const isSelf = u.id === me?.id;
  const name = u.full_name || u.email;

  const lessonDone = new Map((data?.lessons ?? []).map((l) => [l.lesson_id, l]));
  const ratings = data?.checks ?? [];
  const path = parseLearningPath(data?.profile?.learning_path);
  const comfort = (data?.profile?.comfort ?? {}) as Record<string, number>;

  const run = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
      toast.success(label);
    } catch (e) {
      toast.error("That didn't work", { description: e instanceof Error ? e.message : undefined });
    }
  };

  const lessonTitle = (id: string | null) => (id ? findLesson(curriculum, id)?.lesson.title ?? id : "");
  const simTitle = (id: string | null) => SIMULATIONS.find((s) => s.id === id)?.title ?? id ?? "";

  return (
    <div>
      <Link to="/admin/people" className="inline-flex items-center gap-1.5 text-xs uppercase text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        People
      </Link>

      <header className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-3xl text-foreground">{name}</h1>
          <p className="text-muted-foreground">
            {u.email} · joined {new Date(u.created_at).toLocaleDateString()} · {u.created_via === "admin" ? "added by an admin" : "self-registered"}
          </p>
          <div className="mt-2">
            <RiskChips risks={learner.risks} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setDialog("assign")} className={buttonClass.secondary}>
            <ClipboardList className="h-4 w-4" aria-hidden="true" />
            Assign
          </button>
          <button type="button" onClick={() => setDialog("nudge")} className={buttonClass.secondary}>
            <Send className="h-4 w-4" aria-hidden="true" />
            Nudge
          </button>
          <button
            type="button"
            onClick={() =>
              window.confirm(`Generate a new temporary password for ${name}? Their current password stops working.`) &&
              run("New password generated", async () => {
                const r = await actions.resetPassword.mutateAsync(u.id);
                setCredentials([{ email: r.email, password: r.password }]);
              })
            }
            className={buttonClass.secondary}
          >
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            New password
          </button>
        </div>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label="Book" value={`${learner.bookPct}%`} sub={learner.expectedPct !== null ? `expected ${learner.expectedPct}%` : undefined} />
        <Kpi label="Lessons" value={learner.lessonsDone} sub={`${u.visited_lessons} opened`} />
        <Kpi label="Reading time" value={`${Math.round(u.time_spent_seconds / 60)}m`} sub={`${Math.round(u.reading_seconds_7 / 60)}m this week`} />
        <Kpi label="Challenges" value={`${u.sims_passed}/${SIMULATIONS.length}`} sub={`${u.sims_opened} opened`} />
        <Kpi label="Confidence" value={learner.confidence !== null ? `${learner.confidence}%` : "—"} sub={`${u.got_it + u.partly + u.missed} self-checks`} />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <Card title="Every lesson">
            <div className="space-y-3">
              {curriculum.flatMap((p) => p.sections).map((s) => (
                <div key={s.id} className="grid grid-cols-[9rem_minmax(0,1fr)] items-center gap-3">
                  <span className="truncate text-sm text-muted-foreground">
                    {s.bookChapter > 0 ? `${s.number}. ` : "A. "}
                    {s.title}
                  </span>
                  <ul className="flex flex-wrap gap-1">
                    {s.lessons.map((l) => {
                      const row = lessonDone.get(l.id);
                      const state = row?.completed_at ? "done" : row?.first_visited_at ? "opened" : "none";
                      return (
                        <li
                          key={l.id}
                          title={`${l.title}: ${state === "done" ? "completed" : state === "opened" ? "opened" : "not opened"}${row?.time_spent_seconds ? ` · ${Math.round(row.time_spent_seconds / 60)} min` : ""}`}
                          className={cn(
                            "h-5 w-5 rounded",
                            state === "done" ? "bg-primary" : state === "opened" ? "bg-primary/30" : "border border-border bg-secondary"
                          )}
                        >
                          <span className="sr-only">
                            {l.title}: {state}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-primary" aria-hidden="true" /> Completed
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-primary/30" aria-hidden="true" /> Opened
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded border border-border bg-secondary" aria-hidden="true" /> Not opened
              </span>
            </p>
          </Card>

          <Card title="Recent activity">
            {(data?.events ?? []).length === 0 ? (
              <EmptyState>No activity yet.</EmptyState>
            ) : (
              <ol className="space-y-2">
                {data!.events.map((e) => (
                  <li key={e.id} className="flex gap-3 text-sm">
                    <span className="figure w-20 shrink-0 text-xs text-muted-foreground">{relativeTime(e.created_at)}</span>
                    <span className="text-foreground">
                      {EVENT_LABELS[e.type] ?? e.type}{" "}
                      <span className="text-muted-foreground">
                        {e.lesson_id ? lessonTitle(e.lesson_id) : e.sim_id ? simTitle(e.sim_id) : e.type === "search" ? `“${(e.meta as { q?: string })?.q ?? ""}”` : ""}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Questions to the assistant">
              {(data?.questions ?? []).length === 0 ? (
                <EmptyState>None yet.</EmptyState>
              ) : (
                <ul className="space-y-2.5">
                  {data!.questions.map((q) => (
                    <li key={q.id} className="text-sm">
                      <p className="text-foreground">“{q.question}”</p>
                      <p className="text-xs text-muted-foreground">
                        {lessonTitle(q.lesson_id) || "general"} · {relativeTime(q.created_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card title="Self-checks and feedback">
              <p className="text-sm text-foreground">
                {ratings.filter((r) => r.rating === "got_it").length} got it · {ratings.filter((r) => r.rating === "partly").length} partly ·{" "}
                {ratings.filter((r) => r.rating === "missed").length} missed
              </p>
              {ratings.some((r) => r.rating === "missed") && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Missed on:{" "}
                  {[...new Set(ratings.filter((r) => r.rating === "missed").map((r) => lessonTitle(r.lesson_id)))].slice(0, 5).join(", ")}
                </p>
              )}
              <ul className="mt-3 space-y-2">
                {(data?.feedback ?? [])
                  .filter((f) => f.comment)
                  .map((f) => (
                    <li key={f.lesson_id} className="text-sm">
                      <p className="text-foreground">
                        {f.helpful ? "👍" : "👎"} “{f.comment}”
                      </p>
                      <p className="text-xs text-muted-foreground">{lessonTitle(f.lesson_id)}</p>
                    </li>
                  ))}
              </ul>
            </Card>
          </div>
        </div>

        <aside className="space-y-6">
          <Card title="Account">
            <div className="space-y-4 text-sm">
              <label className="block space-y-1.5 text-foreground">
                Role
                <select
                  value={u.role}
                  disabled={isSelf}
                  onChange={(e) =>
                    run("Role updated", () => actions.setRole.mutateAsync({ userId: u.id, role: e.target.value as "admin" | "learner" }))
                  }
                  className={inputClass}
                >
                  <option value="learner">Learner</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <label className="block space-y-1.5 text-foreground">
                Cohort
                <select
                  value={u.cohort_id ?? ""}
                  onChange={(e) => run("Cohort updated", () => actions.setCohort.mutateAsync({ userIds: [u.id], cohortId: e.target.value || null }))}
                  className={inputClass}
                >
                  <option value="">No cohort</option>
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <dl className="grid grid-cols-2 gap-y-2">
                <dt className="text-muted-foreground">Team</dt>
                <dd className="text-foreground">{u.team ?? "—"}</dd>
                <dt className="text-muted-foreground">First sign-in</dt>
                <dd className="text-foreground">{relativeTime(u.first_login_at)}</dd>
                <dt className="text-muted-foreground">Last active</dt>
                <dd className="text-foreground">{relativeTime(u.last_active_at)}</dd>
                <dt className="text-muted-foreground">Weekly goal</dt>
                <dd className="text-foreground">{u.weekly_minutes_goal ? `${u.weekly_minutes_goal} min` : "—"}</dd>
                <dt className="text-muted-foreground">Active days (14)</dt>
                <dd className="text-foreground">{u.active_days_14}</dd>
                <dt className="text-muted-foreground">Badges</dt>
                <dd className="text-foreground">{u.badges}</dd>
              </dl>
              {u.must_change_password && <p className="text-xs text-floor">Still using a temporary password.</p>}
            </div>
          </Card>

          <Card title="Onboarding answers">
            {data?.profile?.onboarding_completed_at ? (
              <div className="space-y-3 text-sm">
                <p className="text-foreground">Team: {u.team ?? "—"}</p>
                <ul className="space-y-1">
                  {curriculum.map((p) => (
                    <li key={p.id} className="flex justify-between gap-2">
                      <span className="truncate text-muted-foreground">{p.title.replace(/^(Part [IVX]+|Appendix) — /, "")}</span>
                      <span className="text-foreground">{["", "New", "Heard of it", "", "Comfortable", "Expert"][comfort[p.id] ?? 2] || "—"}</span>
                    </li>
                  ))}
                </ul>
                {path && (
                <p className="text-xs text-muted-foreground">
                  Path starts with {path.order.slice(0, 3).map((id) => curriculum.flatMap((p) => p.sections).find((s) => s.id === id)?.title).join(", ")}…
                </p>
                )}
              </div>
            ) : (
              <EmptyState>Hasn't finished onboarding.</EmptyState>
            )}
          </Card>

          <Card title="Assignments">
            {(data?.assignments ?? []).length === 0 ? (
              <EmptyState>Nothing assigned individually.</EmptyState>
            ) : (
              <ul className="space-y-2">
                {data!.assignments.map((a) => {
                  const t = assignmentTarget(a as never);
                  return (
                    <li key={a.id} className="flex items-start gap-2 text-sm">
                      <span className="min-w-0 flex-1">
                        <span className="block text-foreground">{t?.title ?? a.target_id}</span>
                        {a.due_date && <span className="text-xs text-muted-foreground">Due {a.due_date}</span>}
                      </span>
                      <button
                        type="button"
                        onClick={() => run("Assignment removed", () => actions.deleteAssignment.mutateAsync(a.id))}
                        aria-label="Remove assignment"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title="Book progress">
            <PctBar value={learner.bookPct} expected={learner.expectedPct} />
            <p className="mt-2 text-xs text-muted-foreground">The marker shows where they'd be on schedule.</p>
          </Card>

          {!isSelf && (
            <Card title="Careful">
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() =>
                    window.confirm(`Reset ${name}'s lesson progress? Notes are kept.`) && run("Progress reset", () => actions.resetProgress.mutateAsync(u.id))
                  }
                  className={buttonClass.secondary}
                >
                  Reset progress
                </button>
                <button
                  type="button"
                  onClick={() =>
                    run(u.status === "suspended" ? "Reactivated" : "Suspended", () =>
                      actions.setStatus.mutateAsync({ userId: u.id, status: u.status === "suspended" ? "active" : "suspended" })
                    )
                  }
                  className={buttonClass.secondary}
                >
                  {u.status === "suspended" ? <UserCheck className="h-4 w-4" aria-hidden="true" /> : <UserX className="h-4 w-4" aria-hidden="true" />}
                  {u.status === "suspended" ? "Reactivate account" : "Suspend account"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    window.prompt(`Type DELETE to permanently remove ${name} and all their data.`) === "DELETE" &&
                    run("Account deleted", async () => {
                      await actions.deleteUser.mutateAsync(u.id);
                      navigate("/admin/people");
                    })
                  }
                  className={buttonClass.danger}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete account
                </button>
              </div>
            </Card>
          )}
        </aside>
      </div>

      <AssignDialog
        open={dialog === "assign"}
        onClose={() => setDialog(null)}
        audience={name}
        onAssign={async (v) => {
          await actions.assign.mutateAsync({ userIds: [u.id], targetType: v.type, targetId: v.id, dueDate: v.dueDate, note: v.note, assignedBy: me!.id });
        }}
      />
      <NudgeDialog
        open={dialog === "nudge"}
        onClose={() => setDialog(null)}
        audience={name}
        onSend={async ({ title, body }) => {
          await actions.nudge.mutateAsync({ userIds: [u.id], title, body, link: "/dashboard", sentBy: me!.id });
        }}
      />
      <CredentialsDialog open={credentials.length > 0} onClose={() => setCredentials([])} credentials={credentials} />
    </div>
  );
}
