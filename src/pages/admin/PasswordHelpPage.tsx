import { useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";

import { CredentialsDialog, EmptyState, PageHeader, buttonClass, relativeTime } from "@/components/admin/ui";
import { useAdminActions, useLearners, useResetRequests } from "@/lib/admin/api";
import { useAuth } from "@/lib/auth/AuthProvider";

/** People who lost their recovery code and asked for a new password. */
export default function PasswordHelpPage() {
  const { user } = useAuth();
  const { data: requests = [], isLoading } = useResetRequests();
  const { learners } = useLearners();
  const { resetPassword, dismissResetRequest } = useAdminActions();
  const [credentials, setCredentials] = useState<Array<{ email: string; password: string }>>([]);

  return (
    <div>
      <PageHeader
        title="Password help"
        description="Learners who lost both their password and recovery code. Generate a temporary password and share it with them directly."
      />
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : requests.length === 0 ? (
        <EmptyState>No one is waiting. Requests appear here when someone uses “I lost my code”.</EmptyState>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {requests.map((r) => {
            const account = learners.find((l) => l.user.email === r.email);
            return (
              <li key={r.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-foreground">{account?.user.full_name ?? r.email}</p>
                  <p className="text-sm text-muted-foreground">
                    {r.email} · asked {relativeTime(r.created_at)}
                    {!account && " · no account with this email"}
                  </p>
                  {r.note && <p className="mt-1 text-sm text-foreground">“{r.note}”</p>}
                </div>
                {account && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await resetPassword.mutateAsync(account.user.id);
                        setCredentials([{ email: res.email, password: res.password }]);
                      } catch (e) {
                        toast.error("Couldn't generate a password", { description: e instanceof Error ? e.message : undefined });
                      }
                    }}
                    className={buttonClass.primary}
                  >
                    <KeyRound className="h-4 w-4" aria-hidden="true" />
                    Generate new password
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => dismissResetRequest.mutate({ id: r.id, by: user!.id }, { onSuccess: () => toast.success("Dismissed") })}
                  className={buttonClass.secondary}
                >
                  Dismiss
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <CredentialsDialog open={credentials.length > 0} onClose={() => setCredentials([])} credentials={credentials} />
    </div>
  );
}
