import { useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ClipboardList, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AssignDialog, Card, EmptyState, PageHeader, PctBar, RiskChips, buttonClass, inputClass } from "@/components/admin/ui";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAdminActions, useLearners, type Cohort } from "@/lib/admin/api";
import { expectedPctFor } from "@/lib/admin/metrics";
import { useAuth } from "@/lib/auth/AuthProvider";

const AXIS = { fontSize: 12, fill: "hsl(var(--muted-foreground))" };

export default function CohortsPage() {
  const { user } = useAuth();
  const { learners, cohorts } = useLearners();
  const { saveCohort, deleteCohort, assign } = useAdminActions();
  const [editing, setEditing] = useState<Partial<Cohort> | null>(null);
  const [assignTo, setAssignTo] = useState<Cohort | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const save = async () => {
    if (!editing?.name?.trim()) return;
    try {
      await saveCohort.mutateAsync({
        id: editing.id,
        name: editing.name.trim(),
        description: editing.description?.trim() || null,
        start_date: editing.start_date || null,
        target_end_date: editing.target_end_date || null,
        createdBy: user!.id,
      });
      toast.success("Cohort saved");
      setEditing(null);
    } catch (e) {
      toast.error("Couldn't save", { description: e instanceof Error ? e.message : undefined });
    }
  };

  return (
    <div>
      <PageHeader
        title="Cohorts"
        description="Group new hires who start together, give them a target date, and compare their pace."
        actions={
          <button type="button" onClick={() => setEditing({})} className={buttonClass.primary}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New cohort
          </button>
        }
      />

      {cohorts.length === 0 ? (
        <EmptyState>No cohorts yet. Create one, then move people into it from People or when adding them.</EmptyState>
      ) : (
        <div className="space-y-6">
          {cohorts.map((c) => {
            const members = learners.filter((l) => l.user.cohort_id === c.id);
            const avg = members.length ? Math.round(members.reduce((a, l) => a + l.bookPct, 0) / members.length) : 0;
            const expected = c.start_date && c.target_end_date ? expectedPctFor(members[0]?.user ?? ({} as never), c) : null;
            const behind = members.filter((l) => l.risks.length > 0).length;
            const open = openId === c.id;
            return (
              <Card
                key={c.id}
                title={c.name}
                actions={
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setAssignTo(c)} className={buttonClass.secondary}>
                      <ClipboardList className="h-4 w-4" aria-hidden="true" />
                      Assign to cohort
                    </button>
                    <button type="button" onClick={() => setEditing(c)} aria-label={`Edit ${c.name}`} className={buttonClass.secondary}>
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        window.confirm(`Delete ${c.name}? Members stay, just without a cohort.`) &&
                        deleteCohort.mutate(c.id, { onSuccess: () => toast.success("Cohort deleted") })
                      }
                      aria-label={`Delete ${c.name}`}
                      className={buttonClass.danger}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                }
              >
                {c.description && <p className="-mt-2 mb-4 text-sm text-muted-foreground">{c.description}</p>}
                <div className="grid gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Members</p>
                    <p className="figure text-2xl text-foreground">{members.length}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Average progress</p>
                    <p className="figure text-2xl text-foreground">{avg}%</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">On schedule</p>
                    <p className="figure text-2xl text-foreground">{expected !== null ? `${expected}%` : "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.start_date ?? "?"} → {c.target_end_date ?? "?"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Needs a hand</p>
                    <p className={`figure text-2xl ${behind > 0 ? "text-floor" : "text-foreground"}`}>{behind}</p>
                  </div>
                </div>

                {members.length > 0 && (
                  <div className="mt-5 h-48" role="img" aria-label={`Book progress for each member of ${c.name}`}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={members.map((l) => ({ name: (l.user.full_name || l.user.email).split(" ")[0], pct: l.bookPct }))}
                        margin={{ top: 8, right: 8, bottom: 0, left: -24 }}
                      >
                        <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={AXIS} tickLine={false} axisLine={false} interval={0} />
                        <YAxis domain={[0, 100]} tick={AXIS} tickLine={false} axisLine={false} unit="%" />
                        <Tooltip
                          cursor={{ fill: "hsl(var(--secondary))" }}
                          contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
                          formatter={(v) => [`${v}%`, "Book progress"]}
                        />
                        {expected !== null && (
                          <ReferenceLine
                            y={expected}
                            stroke="hsl(var(--foreground))"
                            strokeDasharray="4 4"
                            label={{ value: "on schedule", position: "insideTopRight", fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                          />
                        )}
                        <Bar dataKey="pct" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <button type="button" onClick={() => setOpenId(open ? null : c.id)} aria-expanded={open} className="mt-4 text-sm text-primary hover:underline">
                  {open ? "Hide members" : "Show members"}
                </button>
                {open && (
                  <ul className="mt-3 divide-y divide-border">
                    {members.map((l) => (
                      <li key={l.user.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                        <Link to={`/admin/people/${l.user.id}`} className="min-w-0 flex-1 text-foreground hover:underline">
                          {l.user.full_name || l.user.email}
                        </Link>
                        <RiskChips risks={l.risks} />
                        <span className="w-40">
                          <PctBar value={l.bookPct} expected={l.expectedPct} />
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit cohort" : "New cohort"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block space-y-1.5 text-sm text-foreground">
              Name
              <input value={editing?.name ?? ""} onChange={(e) => setEditing((c) => ({ ...c, name: e.target.value }))} className={inputClass} />
            </label>
            <label className="block space-y-1.5 text-sm text-foreground">
              Description
              <input value={editing?.description ?? ""} onChange={(e) => setEditing((c) => ({ ...c, description: e.target.value }))} className={inputClass} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5 text-sm text-foreground">
                Starts
                <input type="date" value={editing?.start_date ?? ""} onChange={(e) => setEditing((c) => ({ ...c, start_date: e.target.value }))} className={inputClass} />
              </label>
              <label className="block space-y-1.5 text-sm text-foreground">
                Finish by
                <input
                  type="date"
                  value={editing?.target_end_date ?? ""}
                  onChange={(e) => setEditing((c) => ({ ...c, target_end_date: e.target.value }))}
                  className={inputClass}
                />
              </label>
            </div>
          </div>
          <DialogFooter>
            <button type="button" onClick={() => setEditing(null)} className={buttonClass.secondary}>
              Cancel
            </button>
            <button type="button" onClick={save} disabled={!editing?.name?.trim() || saveCohort.isPending} className={buttonClass.primary}>
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AssignDialog
        open={assignTo !== null}
        onClose={() => setAssignTo(null)}
        audience={assignTo?.name ?? ""}
        onAssign={async (v) => {
          await assign.mutateAsync({ cohortId: assignTo!.id, targetType: v.type, targetId: v.id, dueDate: v.dueDate, note: v.note, assignedBy: user!.id });
        }}
      />
    </div>
  );
}
