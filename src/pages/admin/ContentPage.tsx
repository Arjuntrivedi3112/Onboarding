import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpDown } from "lucide-react";

import { Card, EmptyState, PageHeader, relativeTime } from "@/components/admin/ui";
import { curriculum, findLesson, lessonList, lessonPath } from "@/curriculum";
import { useFeedbackComments, useLearners, useLessonStats, useSimStats } from "@/lib/admin/api";
import { lessonInsights, type LessonInsight } from "@/lib/admin/metrics";
import { cn } from "@/lib/utils";
import { SIMULATIONS } from "@/simulations/registry";

type SortKey = "struggle" | "viewers" | "completion" | "time" | "lesson";

/** Confidence split as three labelled segments (status colours, never alone). */
function ConfidenceBar({ got, partly, missed }: { got: number; partly: number; missed: number }) {
  const total = got + partly + missed;
  if (total === 0) return <span className="text-xs text-muted-foreground">No ratings</span>;
  const seg = (n: number) => `${(n / total) * 100}%`;
  return (
    <div title={`${got} got it · ${partly} partly · ${missed} missed`}>
      <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
        {got > 0 && <span className="h-full rounded-full bg-primary" style={{ width: seg(got) }} />}
        {partly > 0 && <span className="h-full rounded-full bg-floor" style={{ width: seg(partly) }} />}
        {missed > 0 && <span className="h-full rounded-full bg-nobid" style={{ width: seg(missed) }} />}
      </div>
      <span className="figure text-xs text-muted-foreground">
        {got}✓ {partly}~ {missed}✗
      </span>
    </div>
  );
}

export default function ContentPage() {
  const { data: stats = [], isLoading } = useLessonStats();
  const { data: sims = [] } = useSimStats();
  const { data: feedback = [] } = useFeedbackComments();
  const { learners } = useLearners();
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "struggle", desc: true });
  const [section, setSection] = useState("all");

  const insights = useMemo(() => {
    const byId = new Map(lessonInsights(stats).map((i) => [i.stat.lesson_id, i]));
    // Include lessons with no data yet so gaps are visible too.
    return lessonList.map(
      (ref): LessonInsight =>
        byId.get(ref.lesson.id) ?? {
          stat: { lesson_id: ref.lesson.id, viewers: 0, completers: 0, avg_seconds: 0, got_it: 0, partly: 0, missed: 0, helpful_yes: 0, helpful_no: 0, comments: 0, chat_questions: 0 },
          title: ref.lesson.title,
          sectionTitle: ref.section.title,
          expectedMinutes: ref.lesson.minutes,
          completionRate: null,
          missedShare: null,
          helpfulShare: null,
          struggleScore: 0,
          reasons: [],
        }
    );
  }, [stats]);

  const rows = useMemo(() => {
    const filtered = insights.filter((i) => section === "all" || findLesson(curriculum, i.stat.lesson_id)?.section.id === section);
    const dir = sort.desc ? -1 : 1;
    const key = (i: LessonInsight) =>
      sort.key === "struggle"
        ? i.struggleScore
        : sort.key === "viewers"
          ? i.stat.viewers
          : sort.key === "completion"
            ? i.completionRate ?? -1
            : sort.key === "time"
              ? i.stat.avg_seconds
              : lessonList.findIndex((r) => r.lesson.id === i.stat.lesson_id);
    return [...filtered].sort((a, b) => (key(a) - key(b)) * dir);
  }, [insights, sort, section]);

  const nameOf = (id: string) => learners.find((l) => l.user.id === id)?.user.full_name ?? "A learner";
  const comments = feedback.filter((f) => f.comment);

  const head = (key: SortKey, label: string) => (
    <button
      type="button"
      onClick={() => setSort((s) => ({ key, desc: s.key === key ? !s.desc : key !== "lesson" }))}
      className="inline-flex items-center gap-1 hover:text-foreground"
    >
      {label}
      <ArrowUpDown className={cn("h-3 w-3", sort.key === key ? "text-foreground" : "opacity-40")} aria-hidden="true" />
    </button>
  );

  return (
    <div>
      <PageHeader
        title="Content insights"
        description="Which lessons and simulators land, and which need work — from completions, reading time, self-check confidence, feedback and questions."
      />

      <Card title="Simulators" className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2 font-normal">Simulator</th>
                <th className="py-2 text-right font-normal">Opened by</th>
                <th className="py-2 text-right font-normal">Beaten by</th>
                <th className="py-2 text-right font-normal">Pass rate</th>
                <th className="py-2 text-right font-normal">Total runs</th>
              </tr>
            </thead>
            <tbody>
              {SIMULATIONS.map((sim) => {
                const s = sims.find((x) => x.sim_id === sim.id);
                const rate = s && s.openers > 0 ? Math.round((s.passers / s.openers) * 100) : null;
                return (
                  <tr key={sim.id} className="border-t border-border">
                    <td className="py-2">
                      <Link to={`/lab/${sim.id}`} className="text-foreground hover:underline">
                        {sim.title}
                      </Link>
                    </td>
                    <td className="figure py-2 text-right text-foreground">{s?.openers ?? 0}</td>
                    <td className="figure py-2 text-right text-foreground">{s?.passers ?? 0}</td>
                    <td className={cn("figure py-2 text-right", rate !== null && rate < 40 ? "text-floor" : "text-foreground")}>
                      {rate !== null ? `${rate}%` : "—"}
                    </td>
                    <td className="figure py-2 text-right text-foreground">{s?.total_runs ?? 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        title="Lessons"
        actions={
          <select
            aria-label="Section"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All sections</option>
            {curriculum.flatMap((p) => p.sections).map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        }
      >
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[60rem] text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 font-normal">{head("lesson", "Lesson")}</th>
                  <th className="py-2 text-right font-normal">{head("viewers", "Readers")}</th>
                  <th className="py-2 text-right font-normal">{head("completion", "Finish rate")}</th>
                  <th className="py-2 text-right font-normal">{head("time", "Avg time")}</th>
                  <th className="w-32 py-2 pl-4 font-normal">Confidence</th>
                  <th className="py-2 text-right font-normal">Helpful</th>
                  <th className="py-2 text-right font-normal">AI qs</th>
                  <th className="py-2 pl-4 font-normal">{head("struggle", "Signals")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((i) => {
                  const ref = findLesson(curriculum, i.stat.lesson_id);
                  const avgMin = Math.round(i.stat.avg_seconds / 60);
                  return (
                    <tr key={i.stat.lesson_id} className="border-t border-border align-top">
                      <td className="py-2.5 pr-3">
                        {ref ? (
                          <Link to={lessonPath(ref)} className="text-foreground hover:underline">
                            {i.title}
                          </Link>
                        ) : (
                          i.title
                        )}
                        <span className="block text-xs text-muted-foreground">{i.sectionTitle}</span>
                      </td>
                      <td className="figure py-2.5 text-right text-foreground">{i.stat.viewers}</td>
                      <td className={cn("figure py-2.5 text-right", i.completionRate !== null && i.completionRate < 60 ? "text-floor" : "text-foreground")}>
                        {i.completionRate !== null ? `${i.completionRate}%` : "—"}
                      </td>
                      <td className="figure py-2.5 text-right text-foreground">
                        {i.stat.avg_seconds ? `${avgMin}m` : "—"}
                        <span className="block text-xs text-muted-foreground">of ~{i.expectedMinutes}m</span>
                      </td>
                      <td className="py-2.5 pl-4">
                        <ConfidenceBar got={i.stat.got_it} partly={i.stat.partly} missed={i.stat.missed} />
                      </td>
                      <td className="figure py-2.5 text-right text-foreground">{i.helpfulShare !== null ? `${i.helpfulShare}%` : "—"}</td>
                      <td className="figure py-2.5 text-right text-foreground">{i.stat.chat_questions}</td>
                      <td className="py-2.5 pl-4 text-xs text-muted-foreground">{i.reasons.join(" · ") || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>Confidence:</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-full bg-primary" aria-hidden="true" /> ✓ Got it
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-full bg-floor" aria-hidden="true" /> ~ Partly
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-full bg-nobid" aria-hidden="true" /> ✗ Missed
          </span>
        </p>
      </Card>

      <Card title={`Feedback comments (${comments.length})`} className="mt-6">
        {comments.length === 0 ? (
          <EmptyState>No comments yet.</EmptyState>
        ) : (
          <ul className="space-y-3">
            {comments.map((f) => (
              <li key={`${f.user_id}-${f.lesson_id}`} className="text-sm">
                <p className="text-foreground">
                  <span className={f.helpful ? "text-primary" : "text-nobid"}>{f.helpful ? "Helpful" : "Not helpful"}</span> — “{f.comment}”
                </p>
                <p className="text-xs text-muted-foreground">
                  {findLesson(curriculum, f.lesson_id)?.lesson.title ?? f.lesson_id} · {nameOf(f.user_id)} · {relativeTime(f.updated_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
