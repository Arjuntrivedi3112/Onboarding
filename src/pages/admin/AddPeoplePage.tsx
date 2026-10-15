import { useState } from "react";
import { Link } from "react-router-dom";
import { Download, UserPlus } from "lucide-react";

import { Card, CredentialsDialog, PageHeader, buttonClass, inputClass } from "@/components/admin/ui";
import { useAdminActions, useCohorts, type CreatedAccount } from "@/lib/admin/api";
import { downloadCsv, parsePeople, toCsv } from "@/lib/admin/metrics";

/**
 * Create accounts directly — no emails are sent. Each person gets a
 * generated temporary password, shown here once to share by hand; they set
 * their own password and save a recovery code on first sign-in.
 */
export default function AddPeoplePage() {
  const { data: cohorts = [] } = useCohorts();
  const { createUsers } = useAdminActions();
  const [text, setText] = useState("");
  const [role, setRole] = useState<"learner" | "admin">("learner");
  const [cohortId, setCohortId] = useState("");
  const [results, setResults] = useState<CreatedAccount[]>([]);
  const [showCreds, setShowCreds] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { people, invalid } = parsePeople(text);
  const created = results.filter((r) => r.ok && r.password) as Array<Required<Pick<CreatedAccount, "email" | "password">> & CreatedAccount>;

  const submit = async () => {
    setError(null);
    try {
      const { results: out } = await createUsers.mutateAsync({
        users: people.map((p) => ({ ...p, role, cohort_id: cohortId || null })),
      });
      setResults(out);
      if (out.some((r) => r.ok)) {
        setShowCreds(true);
        setText(out.filter((r) => !r.ok).map((r) => r.email).join("\n"));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create accounts");
    }
  };

  return (
    <div>
      <PageHeader
        title="Add people"
        description="Paste one person per line. Each gets a temporary password to share with them directly — nothing is emailed."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <label htmlFor="people" className="text-sm text-foreground">
            People
          </label>
          <textarea
            id="people"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder={"ada@iqm.com\nGrace Hopper <grace@partner.com>\nlinus@iqm.com, Linus Torvalds"}
            className="figure mt-1.5 w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
            {people.length} {people.length === 1 ? "person" : "people"} ready
            {people.some((p) => !p.full_name) && (
              <span className="block">
                {people.filter((p) => !p.full_name).length} without a name — they'll be asked for it at first sign-in. Write{" "}
                <span className="figure">Ada Lovelace &lt;ada@iqm.com&gt;</span> to fill it in now.
              </span>
            )}
            {invalid.length > 0 && <span className="text-floor"> · couldn't read: {invalid.slice(0, 3).join(", ")}</span>}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm text-foreground">
              Role
              <select value={role} onChange={(e) => setRole(e.target.value as "learner" | "admin")} className={inputClass}>
                <option value="learner">Learner</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label className="space-y-1.5 text-sm text-foreground">
              Cohort
              <select value={cohortId} onChange={(e) => setCohortId(e.target.value)} className={inputClass}>
                <option value="">No cohort</option>
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error}
            </p>
          )}

          <button type="button" onClick={submit} disabled={people.length === 0 || createUsers.isPending} className={`${buttonClass.primary} mt-5`}>
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            {createUsers.isPending ? "Creating…" : `Create ${people.length || ""} ${people.length === 1 ? "account" : "accounts"}`}
          </button>
        </Card>

        <aside className="space-y-4">
          <Card title="How it works">
            <ol className="list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
              <li>Accounts are created instantly with a temporary password.</li>
              <li>Share each password privately — copy the ready-made message.</li>
              <li>On first sign-in they choose their own password and save a recovery code.</li>
              <li>Then onboarding builds their personal path.</li>
            </ol>
            <p className="mt-3 text-sm text-muted-foreground">
              Anyone with an @iqm.com email can also sign up themselves. Use this for everyone else, or to set cohorts up front.
            </p>
          </Card>
          {cohorts.length === 0 && (
            <Card title="Tip">
              <p className="text-sm text-muted-foreground">
                <Link to="/admin/cohorts" className="text-primary hover:underline">
                  Create a cohort
                </Link>{" "}
                first to track a group of new hires against a target date.
              </p>
            </Card>
          )}
        </aside>
      </div>

      {results.length > 0 && (
        <Card
          className="mt-6"
          title="Results"
          actions={
            created.length > 0 && (
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowCreds(true)} className={buttonClass.secondary}>
                  Show passwords
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadCsv(
                      `new-accounts-${new Date().toISOString().slice(0, 10)}.csv`,
                      toCsv(created.map((r) => ({ email: r.email, temporary_password: r.password, sign_in: window.location.origin })))
                    )
                  }
                  className={buttonClass.secondary}
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download CSV
                </button>
              </div>
            )
          }
        >
          <ul className="divide-y divide-border text-sm">
            {results.map((r) => (
              <li key={r.email} className="flex items-center justify-between gap-3 py-2">
                <span className="text-foreground">{r.email}</span>
                <span className={r.ok ? "text-primary" : "text-destructive"}>{r.ok ? "Created" : r.error}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <CredentialsDialog
        open={showCreds}
        onClose={() => setShowCreds(false)}
        credentials={created.map((r) => ({ email: r.email, password: r.password! }))}
      />
    </div>
  );
}
