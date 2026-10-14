import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpDown, ClipboardList, Download, Search, Send } from "lucide-react";
import { toast } from "sonner";

import { AssignDialog, EmptyState, NudgeDialog, PageHeader, PctBar, RiskChips, buttonClass, inputClass, relativeTime } from "@/components/admin/ui";
import { useAdminActions, useLearners } from "@/lib/admin/api";
import { downloadCsv, toCsv, type LearnerMetrics } from "@/lib/admin/metrics";
import { useAuth } from "@/lib/auth/AuthProvider";
import { TEAMS } from "@/lib/learningPath";
import { cn } from "@/lib/utils";

type Filter = "all" | "at_risk" | "not_signed_in" | "in_progress" | "completed" | "suspended" | "admins";
type SortKey = "name" | "progress" | "active" | "created";

const FILTERS: Array<{ id: Filter; label: string; test: (l: LearnerMetrics) => boolean }> = [
  { id: "all", label: "Everyone", test: () => true },
  { id: "at_risk", label: "Needs a hand", test: (l) => l.risks.length > 0 && !l.risks.includes("suspended") },
  { id: "not_signed_in", label: "Not signed in", test: (l) => l.stage === "not_signed_in" },
  { id: "in_progress", label: "In progress", test: (l) => l.stage === "in_progress" || l.stage === "not_started" || l.stage === "onboarding" },
  { id: "completed", label: "Finished", test: (l) => l.stage === "completed" },
  { id: "suspended", label: "Suspended", test: (l) => l.user.status === "suspended" },
  { id: "admins", label: "Admins", test: (l) => l.user.role === "admin" },
];

const STAGE_LABEL: Record<LearnerMetrics["stage"], string> = {
  not_signed_in: "Not signed in",
  onboarding: "Onboarding",
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Finished",
};

export default function PeoplePage() {
  const { user } = useAuth();
  const { learners, cohorts, isLoading } = useLearners();
  const { setCohort, assign, nudge } = useAdminActions();
  const [params, setParams] = useSearchParams();
  const filter = (params.get("filter") as Filter) ?? "all";
  const [query, setQuery] = useState("");
  const [cohortFilter, setCohortFilter] = useState("any");
  const [teamFilter, setTeamFilter] = useState("any");
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "active", desc: true });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<"assign" | "nudge" | null>(null);

  const cohortName = (id: string | null) => cohorts.find((c) => c.id === id)?.name ?? "—";

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const test = FILTERS.find((f) => f.id === filter)?.test ?? (() => true);
    const out = learners.filter(
      (l) =>
        test(l) &&
        (cohortFilter === "any" || (cohortFilter === "none" ? !l.user.cohort_id : l.user.cohort_id === cohortFilter)) &&
        (teamFilter === "any" || l.user.team === teamFilter) &&
        (!q || `${l.user.full_name ?? ""} ${l.user.email} ${l.user.team ?? ""}`.toLowerCase().includes(q))
    );
    const dir = sort.desc ? -1 : 1;
    const key = (l: LearnerMetrics): string | number => {
      switch (sort.key) {
        case "name":
          return (l.user.full_name || l.user.email).toLowerCase();
        case "progress":
          return l.bookPct;
        case "active":
          return l.user.last_active_at ?? "";
        case "created":
          return l.user.created_at;
      }
    };
    return [...out].sort((a, b) => (key(a) < key(b) ? -dir : key(a) > key(b) ? dir : 0));
  }, [learners, query, filter, cohortFilter, teamFilter, sort]);

  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.user.id));
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.user.id)));
  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const ids = [...selected];

  const exportCsv = () => {
    downloadCsv(
      `adtech-journey-people-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(
        rows.map((l) => ({
          name: l.user.full_name ?? "",
          email: l.user.email,
          team: l.user.team ?? "",
          cohort: cohortName(l.user.cohort_id),
          role: l.user.role,
          status: l.user.status,
          stage: STAGE_LABEL[l.stage],
          book_pct: l.bookPct,
          expected_pct: l.expectedPct ?? "",
          lessons_done: l.lessonsDone,
          reading_minutes: Math.round(l.user.time_spent_seconds / 60),
          challenges_beaten: l.user.sims_passed,
          confidence_pct: l.confidence ?? "",
          last_active: l.user.last_active_at ?? "",
          created: l.user.created_at,
          flags: l.risks.join("; "),
        }))
      )
    );
  };

  const sortButton = (key: SortKey, label: string) => (
    <button
      type="button"
      onClick={() => setSort((s) => ({ key, desc: s.key === key ? !s.desc : key !== "name" }))}
      className="inline-flex items-center gap-1 hover:text-foreground"
      aria-label={`Sort by ${label}`}
    >
      {label}
      <ArrowUpDown className={cn("h-3 w-3", sort.key === key ? "text-foreground" : "opacity-40")} aria-hidden="true" />
    </button>
  );

  return (
    <div>
      <PageHeader
        title="People"
        description={`${learners.length} accounts. Select people to move, assign or nudge them together.`}
        actions={
          <>
            <button type="button" onClick={exportCsv} className={buttonClass.secondary}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Export CSV
            </button>
            <Link to="/admin/add" className={buttonClass.primary}>
              Add people
            </Link>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filter people">
        {FILTERS.map((f) => {
          const count = learners.filter(f.test).length;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setParams(f.id === "all" ? {} : { filter: f.id })}
              className={cn(
                "interactive min-h-[2.25rem] rounded-full border px-3 text-sm",
                filter === f.id ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label} <span className="figure opacity-75">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem_12rem]">
        <label className="relative">
          <span className="sr-only">Search people</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email or team" className={cn(inputClass, "pl-9")} />
        </label>
        <select aria-label="Cohort" value={cohortFilter} onChange={(e) => setCohortFilter(e.target.value)} className={inputClass}>
          <option value="any">Any cohort</option>
          <option value="none">No cohort</option>
          {cohorts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select aria-label="Team" value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} className={inputClass}>
          <option value="any">Any team</option>
          {TEAMS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {selected.size > 0 && (
        <div className="sticky top-16 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-primary/40 bg-card p-3 shadow-card lg:top-2">
          <span className="text-sm text-foreground">{selected.size} selected</span>
          <select
            aria-label="Move selected to cohort"
            defaultValue=""
            onChange={async (e) => {
              const value = e.target.value;
              if (!value) return;
              await setCohort.mutateAsync({ userIds: ids, cohortId: value === "none" ? null : value });
              toast.success("Cohort updated");
              e.target.value = "";
            }}
            className={cn(inputClass, "h-9 w-auto")}
          >
            <option value="">Move to cohort…</option>
            <option value="none">No cohort</option>
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => setDialog("assign")} className={buttonClass.secondary}>
            <ClipboardList className="h-4 w-4" aria-hidden="true" />
            Assign
          </button>
          <button type="button" onClick={() => setDialog("nudge")} className={buttonClass.secondary}>
            <Send className="h-4 w-4" aria-hidden="true" />
            Nudge
          </button>
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-sm text-muted-foreground hover:text-foreground">
            Clear
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState>No one matches these filters.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[56rem] text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="w-10 px-3 py-2.5">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="Select all shown" className="h-4 w-4 accent-primary" />
                </th>
                <th className="px-3 py-2.5 font-normal">{sortButton("name", "Person")}</th>
                <th className="px-3 py-2.5 font-normal">Team and cohort</th>
                <th className="w-48 px-3 py-2.5 font-normal">{sortButton("progress", "Book progress")}</th>
                <th className="px-3 py-2.5 font-normal">Lab</th>
                <th className="px-3 py-2.5 font-normal">{sortButton("active", "Last active")}</th>
                <th className="px-3 py-2.5 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.user.id} className={cn("border-t border-border", selected.has(l.user.id) && "bg-primary/5")}>
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(l.user.id)}
                      onChange={() => toggle(l.user.id)}
                      aria-label={`Select ${l.user.full_name || l.user.email}`}
                      className="h-4 w-4 accent-primary"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <Link to={`/admin/people/${l.user.id}`} className="block text-foreground hover:underline">
                      {l.user.full_name || "—"}
                      {l.user.role === "admin" && (
                        <span className="ml-2 rounded-full border border-primary/30 px-1.5 text-xs text-primary">Admin</span>
                      )}
                    </Link>
                    <span className="block text-xs text-muted-foreground">{l.user.email}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="block text-foreground">{l.user.team ?? "—"}</span>
                    <span className="block text-xs text-muted-foreground">{cohortName(l.user.cohort_id)}</span>
                  </td>
                  <td className="px-3 py-3">
                    <PctBar value={l.bookPct} expected={l.expectedPct} />
                    <span className="text-xs text-muted-foreground">
                      {l.lessonsDone} lessons · {Math.round(l.user.time_spent_seconds / 60)} min read
                    </span>
                  </td>
                  <td className="figure px-3 py-3 text-foreground">
                    {l.user.sims_passed}
                    <span className="text-muted-foreground">/{l.user.sims_opened} </span>
                    <span className="block text-xs text-muted-foreground">beaten/opened</span>
                  </td>
                  <td className="px-3 py-3 text-foreground">{relativeTime(l.user.last_active_at)}</td>
                  <td className="px-3 py-3">
                    <span className="block text-xs text-muted-foreground">{STAGE_LABEL[l.stage]}</span>
                    <RiskChips risks={l.risks} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AssignDialog
        open={dialog === "assign"}
        onClose={() => setDialog(null)}
        audience={`${ids.length} ${ids.length === 1 ? "person" : "people"}`}
        onAssign={async (v) => {
          await assign.mutateAsync({ userIds: ids, targetType: v.type, targetId: v.id, dueDate: v.dueDate, note: v.note, assignedBy: user!.id });
        }}
      />
      <NudgeDialog
        open={dialog === "nudge"}
        onClose={() => setDialog(null)}
        audience={`${ids.length} ${ids.length === 1 ? "person" : "people"}`}
        onSend={async ({ title, body }) => {
          await nudge.mutateAsync({ userIds: ids, title, body, link: "/dashboard", sentBy: user!.id });
        }}
      />
    </div>
  );
}
