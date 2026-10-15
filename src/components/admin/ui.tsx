import { useState, type ReactNode } from "react";
import { AlertTriangle, Check, Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { curriculum, lessonList, sectionList } from "@/curriculum";
import { RISK_LABELS, type RiskReason } from "@/lib/admin/metrics";
import { cn } from "@/lib/utils";
import { SIMULATIONS } from "@/simulations/registry";

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl text-foreground">{title}</h1>
        {description && <p className="measure mt-1 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Card({ title, children, className, actions }: { title?: ReactNode; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cn("rounded-lg border border-border bg-card p-5", className)}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="text-lg text-foreground">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "warn" }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className={cn("figure mt-1 text-3xl", tone === "warn" ? "text-floor" : "text-foreground")}>{value}</p>
      {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** A thin progress bar with the value beside it (never colour alone). */
export function PctBar({ value, expected, className }: { value: number; expected?: number | null; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative h-2 w-full min-w-[4rem] rounded-full bg-secondary" aria-hidden="true">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, value)}%` }} />
        {expected !== null && expected !== undefined && expected > 0 && (
          <span
            className="absolute -top-1 h-4 w-0.5 rounded bg-foreground/60"
            style={{ left: `calc(${Math.min(100, expected)}% - 1px)` }}
            title={`Expected by now: ${expected}%`}
          />
        )}
      </div>
      <span className="figure w-10 shrink-0 text-right text-sm text-foreground">{value}%</span>
    </div>
  );
}

export function RiskChips({ risks }: { risks: RiskReason[] }) {
  if (risks.length === 0) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {risks.map((r) => (
        <span
          key={r}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
            r === "suspended" ? "border-border text-muted-foreground" : "border-floor/40 text-floor"
          )}
        >
          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
          {RISK_LABELS[r]}
        </span>
      ))}
    </span>
  );
}

/**
 * A table that scrolls sideways inside its own box on narrow screens, with a
 * visible hint so nobody has to guess that more columns are off to the right.
 */
export function ScrollTable({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground lg:hidden">Swipe sideways to see every column →</p>
      <div className={cn("overflow-x-auto", className)}>{children}</div>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{children}</p>;
}

export function relativeTime(iso: string | null): string {
  if (!iso) return "Never";
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return minutes <= 1 ? "Just now" : `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return new Date(iso).toLocaleDateString();
}

export const buttonClass = {
  primary:
    "interactive inline-flex min-h-[2.5rem] items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-60",
  secondary:
    "interactive inline-flex min-h-[2.5rem] items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm text-foreground hover:border-primary/40 disabled:opacity-60",
  danger:
    "interactive inline-flex min-h-[2.5rem] items-center justify-center gap-2 rounded-lg border border-destructive/50 px-4 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-60",
};

export const inputClass =
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Generated credentials, shown exactly once, with copy buttons. */
export function CredentialsDialog({
  open,
  onClose,
  credentials,
}: {
  open: boolean;
  onClose: () => void;
  credentials: Array<{ email: string; password: string }>;
}) {
  const [visible, setVisible] = useState(true);
  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Couldn't copy — select it and copy manually");
    }
  };
  const all = credentials.map((c) => `${c.email}\t${c.password}`).join("\n");
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Share these sign-in details</DialogTitle>
          <DialogDescription>
            Shown once only. Send each person their password directly (Slack DM or in person). They'll choose
            their own password and save a recovery code when they first sign in.
          </DialogDescription>
        </DialogHeader>
        <ul className="max-h-72 space-y-2 overflow-y-auto">
          {credentials.map((c) => (
            <li key={c.email} className="flex items-center gap-2 rounded-lg border border-border p-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-foreground">{c.email}</span>
                <span className="figure block text-base text-foreground">{visible ? c.password : "••••••••••••••"}</span>
              </span>
              <button
                type="button"
                onClick={() => copy(`Sign in at ${window.location.origin}\nEmail: ${c.email}\nTemporary password: ${c.password}`, "Sign-in message")}
                className={buttonClass.secondary}
              >
                <Copy className="h-4 w-4" aria-hidden="true" />
                Copy
              </button>
            </li>
          ))}
        </ul>
        <DialogFooter className="gap-2 sm:justify-between">
          <button type="button" onClick={() => setVisible((v) => !v)} className={buttonClass.secondary}>
            {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            {visible ? "Hide" : "Show"}
          </button>
          <div className="flex gap-2">
            {credentials.length > 1 && (
              <button type="button" onClick={() => copy(all, "All passwords")} className={buttonClass.secondary}>
                <Copy className="h-4 w-4" aria-hidden="true" />
                Copy all
              </button>
            )}
            <button type="button" onClick={onClose} className={buttonClass.primary}>
              <Check className="h-4 w-4" aria-hidden="true" />
              I've shared them
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type TargetType = "lesson" | "section" | "simulation";

/** Choose something to assign: a section, a lesson or a simulator. */
export function TargetPicker({
  type,
  id,
  onChange,
}: {
  type: TargetType;
  id: string;
  onChange: (type: TargetType, id: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
      <select
        aria-label="What to assign"
        value={type}
        onChange={(e) => {
          const t = e.target.value as TargetType;
          onChange(t, t === "section" ? sectionList[0].id : t === "lesson" ? lessonList[0].lesson.id : SIMULATIONS[0].id);
        }}
        className={inputClass}
      >
        <option value="section">Section</option>
        <option value="lesson">Lesson</option>
        <option value="simulation">Simulator</option>
      </select>
      <select aria-label="Which one" value={id} onChange={(e) => onChange(type, e.target.value)} className={inputClass}>
        {type === "section" &&
          sectionList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.bookChapter > 0 ? `${s.number}. ` : "A. "}
              {s.title}
            </option>
          ))}
        {type === "lesson" &&
          curriculum.flatMap((p) => p.sections).map((s) => (
            <optgroup key={s.id} label={s.title}>
              {s.lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </optgroup>
          ))}
        {type === "simulation" &&
          SIMULATIONS.map((sim) => (
            <option key={sim.id} value={sim.id}>
              {sim.title}
            </option>
          ))}
      </select>
    </div>
  );
}

export function AssignDialog({
  open,
  onClose,
  audience,
  onAssign,
}: {
  open: boolean;
  onClose: () => void;
  audience: string;
  onAssign: (value: { type: TargetType; id: string; dueDate: string | null; note: string | null }) => Promise<void>;
}) {
  const [type, setType] = useState<TargetType>("section");
  const [id, setId] = useState(sectionList[0].id);
  const [due, setDue] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await onAssign({ type, id, dueDate: due || null, note: note.trim() || null });
      toast.success("Assigned", { description: "They'll see it on their dashboard and in notifications." });
      onClose();
    } catch (e) {
      toast.error("Couldn't assign", { description: e instanceof Error ? e.message : undefined });
    }
    setBusy(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign to {audience}</DialogTitle>
          <DialogDescription>It appears on their dashboard with the due date, and they get a notification.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <TargetPicker
            type={type}
            id={id}
            onChange={(t, i) => {
              setType(t);
              setId(i);
            }}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm text-foreground">
              Due date (optional)
              <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={inputClass} />
            </label>
            <label className="space-y-1.5 text-sm text-foreground">
              Note (optional)
              <input value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} className={inputClass} placeholder="e.g. before Friday's standup" />
            </label>
          </div>
        </div>
        <DialogFooter>
          <button type="button" onClick={onClose} className={buttonClass.secondary}>
            Cancel
          </button>
          <button type="button" onClick={submit} disabled={busy} className={buttonClass.primary}>
            {busy ? "Assigning…" : "Assign"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NudgeDialog({
  open,
  onClose,
  audience,
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  audience: string;
  onSend: (value: { title: string; body: string }) => Promise<void>;
}) {
  const [title, setTitle] = useState("Quick check-in");
  const [body, setBody] = useState("How's the AdTech Journey going? Your next lesson is waiting on your dashboard — shout if anything is unclear.");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      await onSend({ title: title.trim(), body: body.trim() });
      toast.success("Nudge sent");
      onClose();
    } catch (e) {
      toast.error("Couldn't send", { description: e instanceof Error ? e.message : undefined });
    }
    setBusy(false);
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nudge {audience}</DialogTitle>
          <DialogDescription>An in-app notification — it shows on their bell next time they open the journey.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label className="block space-y-1.5 text-sm text-foreground">
            Title
            <input value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </label>
          <label className="block space-y-1.5 text-sm text-foreground">
            Message
            <textarea
              value={body}
              maxLength={2000}
              rows={4}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        </div>
        <DialogFooter>
          <button type="button" onClick={onClose} className={buttonClass.secondary}>
            Cancel
          </button>
          <button type="button" onClick={submit} disabled={busy || !title.trim()} className={buttonClass.primary}>
            {busy ? "Sending…" : "Send nudge"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
