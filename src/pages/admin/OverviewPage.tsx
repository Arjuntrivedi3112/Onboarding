import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, KeyRound, Send, Table2 } from "lucide-react";

import { Card, EmptyState, Kpi, NudgeDialog, PageHeader, PctBar, RiskChips, buttonClass, relativeTime } from "@/components/admin/ui";
import { curriculum, findLesson } from "@/curriculum";
import { useAdminActions, useChatQuestions, useDailyActivity, useLearners, useLessonStats, useResetRequests } from "@/lib/admin/api";
import { lessonInsights, onboardingFunnel } from "@/lib/admin/metrics";
import { useAuth } from "@/lib/auth/AuthProvider";
import { SIMULATIONS } from "@/simulations/registry";

const AXIS = { fontSize: 12, fill: "hsl(var(--muted-foreground))" };

function shortDate(day: string) {
  return new Date(day + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** A single-series trend with a hover tooltip and a table alternative. */
function TrendChart({
  title,
  data,
  dataKey,
  unit,
  kind,
}: {
  title: string;
  data: Array<Record<string, number | string>>;
  dataKey: string;
  unit: string;
  kind: "area" | "bar";
}) {
  const [asTable, setAsTable] = useState(false);
  const total = data.reduce((a, d) => a + Number(d[dataKey] ?? 0), 0);
  return (
    <Card
      title={title}
      actions={
        <button type="button" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <Table2 className="h-4 w-4" aria-hidden="true" />
          {asTable ? "Chart" : "Table"}
        </button>
      }
    >
      {asTable ? (
        <div className="max-h-56 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-1 font-normal">Day</th>
                <th className="py-1 text-right font-normal">{unit}</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((d) => (
                <tr key={String(d.day)} className="border-t border-border">
                  <td className="py-1 text-foreground">{shortDate(String(d.day))}</td>
                  <td className="figure py-1 text-right text-foreground">{d[dataKey]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-48" role="img" aria-label={`${title}: ${total} ${unit} over ${data.length} days`}>
          <ResponsiveContainer width="100%" height="100%">
            {kind === "area" ? (
              <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tickFormatter={shortDate} tick={AXIS} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "3 3" }}
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
                  labelFormatter={(d) => shortDate(String(d))}
                  formatter={(v) => [v, unit]}
                />
                <Area type="monotone" dataKey={dataKey} stroke="hsl(var(--primary))" strokeWidth={2} fill="hsl(var(--primary) / 0.15)" activeDot={{ r: 4 }} />
              </AreaChart>
            ) : (
              <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tickFormatter={shortDate} tick={AXIS} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "hsl(var(--secondary))" }}
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
                  labelFormatter={(d) => shortDate(String(d))}
                  formatter={(v) => [v, unit]}
                />
                <Bar dataKey={dataKey} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={18} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

export default function OverviewPage() {
  const { user } = useAuth();
  const { learners, isLoading } = useLearners();
  const { data: daily = [] } = useDailyActivity(30);
  const { data: lessonStats = [] } = useLessonStats();
  const { data: questions = [] } = useChatQuestions(6);
  const { data: requests = [] } = useResetRequests();
  const { nudge } = useAdminActions();
  const [nudgeIds, setNudgeIds] = useState<string[] | null>(null);

  const people = learners.filter((l) => l.user.role === "learner");
  const active7 = people.filter((l) => l.daysSinceActive !== null && l.daysSinceActive < 7).length;
  const neverSignedIn = people.filter((l) => !l.user.first_login_at).length;
  const avgPct = people.length ? Math.round(people.reduce((a, l) => a + l.bookPct, 0) / people.length) : 0;
  const challenges = people.reduce((a, l) => a + l.user.sims_passed, 0);
  const atRisk = people.filter((l) => l.risks.length > 0 && !l.risks.includes("suspended"));
  const funnel = onboardingFunnel(people);
  const struggles = useMemo(() => lessonInsights(lessonStats).filter((i) => i.struggleScore > 0).slice(0, 6), [lessonStats]);
  const nameOf = (id: string) => learners.find((l) => l.user.id === id)?.user.full_name ?? "A learner";

  if (isLoading) return <p className="text-muted-foreground">Loading the console…</p>;

  return (
    <div>
      <PageHeader
        title="Overview"
        description="How onboarding is going across everyone, and who could use a hand."
        actions={
          <Link to="/admin/add" className={buttonClass.primary}>
            Add people
          </Link>
        }
      />

      {requests.length > 0 && (
        <Link
          to="/admin/password-help"
          className="mb-6 flex items-center gap-3 rounded-lg border border-floor/40 bg-floor/10 p-4 text-sm text-foreground hover:bg-floor/15"
        >
          <KeyRound className="h-4 w-4 text-floor" aria-hidden="true" />
          {requests.length} {requests.length === 1 ? "person needs" : "people need"} a new password
          <ArrowRight className="ml-auto h-4 w-4" aria-hidden="true" />
        </Link>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label="Key numbers">
        <Kpi label="Learners" value={people.length} sub={`${learners.length - people.length} ${learners.length - people.length === 1 ? "admin" : "admins"}`} />
        <Kpi label="Active this week" value={active7} sub={people.length ? `${Math.round((active7 / people.length) * 100)}% of learners` : undefined} />
        <Kpi label="Not signed in yet" value={neverSignedIn} tone={neverSignedIn > 0 ? "warn" : undefined} sub="accounts never used" />
        <Kpi label="Average progress" value={`${avgPct}%`} sub="of the book" />
        <Kpi label="Challenges beaten" value={challenges} sub={`across ${SIMULATIONS.length} simulators`} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <TrendChart title="Active learners per day" data={daily} dataKey="active_users" unit="learners" kind="area" />
        <TrendChart title="Lessons completed per day" data={daily} dataKey="lessons_completed" unit="lessons" kind="bar" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Onboarding funnel">
          <ol className="space-y-2.5">
            {funnel.map((step) => {
              const pct = funnel[0].count ? (step.count / funnel[0].count) * 100 : 0;
              return (
                <li key={step.label} className="grid grid-cols-[8.5rem_minmax(0,1fr)_3rem] items-center gap-3 text-sm">
                  <span className="text-muted-foreground">{step.label}</span>
                  <span className="h-5 rounded bg-secondary" aria-hidden="true">
                    <span className="block h-full rounded bg-primary transition-[width] duration-500" style={{ width: `${Math.max(pct, step.count > 0 ? 2 : 0)}%` }} />
                  </span>
                  <span className="figure text-right text-foreground">{step.count}</span>
                </li>
              );
            })}
          </ol>
        </Card>

        <Card
          title={`Needs a hand (${atRisk.length})`}
          actions={
            atRisk.length > 0 && (
              <button type="button" onClick={() => setNudgeIds(atRisk.map((l) => l.user.id))} className={buttonClass.secondary}>
                <Send className="h-4 w-4" aria-hidden="true" />
                Nudge all
              </button>
            )
          }
        >
          {atRisk.length === 0 ? (
            <EmptyState>Everyone is on track.</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {atRisk.slice(0, 8).map((l) => (
                <li key={l.user.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <Link to={`/admin/people/${l.user.id}`} className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-foreground hover:underline">{l.user.full_name || l.user.email}</span>
                    <span className="mt-1 block">
                      <RiskChips risks={l.risks} />
                    </span>
                  </Link>
                  <span className="w-28">
                    <PctBar value={l.bookPct} expected={l.expectedPct} />
                  </span>
                  <button type="button" onClick={() => setNudgeIds([l.user.id])} className="text-sm text-primary hover:underline">
                    Nudge
                  </button>
                </li>
              ))}
            </ul>
          )}
          {atRisk.length > 8 && (
            <Link to="/admin/people?filter=at_risk" className="mt-3 inline-block text-sm text-primary hover:underline">
              See all {atRisk.length}
            </Link>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card
          title="Where people struggle"
          actions={
            <Link to="/admin/content" className="text-sm text-primary hover:underline">
              All lessons
            </Link>
          }
        >
          {struggles.length === 0 ? (
            <EmptyState>Not enough signal yet. This fills in as people rate self-checks, leave feedback and ask questions.</EmptyState>
          ) : (
            <ol className="space-y-3">
              {struggles.map((s) => {
                const ref = findLesson(curriculum, s.stat.lesson_id);
                return (
                  <li key={s.stat.lesson_id}>
                    <p className="text-sm text-foreground">
                      {s.title}
                      <span className="text-muted-foreground"> · {s.sectionTitle}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{s.reasons.join(" · ")}</p>
                    {ref && <span className="sr-only">Section {ref.section.number}</span>}
                  </li>
                );
              })}
            </ol>
          )}
        </Card>

        <Card
          title="Latest questions to the assistant"
          actions={
            <Link to="/admin/questions" className="text-sm text-primary hover:underline">
              All questions
            </Link>
          }
        >
          {questions.length === 0 ? (
            <EmptyState>No questions yet.</EmptyState>
          ) : (
            <ul className="space-y-3">
              {questions.map((q) => (
                <li key={q.id} className="text-sm">
                  <p className="text-foreground">“{q.question}”</p>
                  <p className="text-xs text-muted-foreground">
                    {nameOf(q.user_id)} · {q.lesson_id ? findLesson(curriculum, q.lesson_id)?.lesson.title ?? q.lesson_id : "general"} ·{" "}
                    {relativeTime(q.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <NudgeDialog
        open={nudgeIds !== null}
        onClose={() => setNudgeIds(null)}
        audience={nudgeIds && nudgeIds.length === 1 ? nameOf(nudgeIds[0]) : `${nudgeIds?.length ?? 0} people`}
        onSend={async ({ title, body }) => {
          await nudge.mutateAsync({ userIds: nudgeIds ?? [], title, body, link: "/dashboard", sentBy: user!.id });
        }}
      />
    </div>
  );
}
