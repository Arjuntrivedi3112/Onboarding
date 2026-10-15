import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { KeyRound, LifeBuoy } from "lucide-react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Field, FormError, PasswordField, PasswordStrength, SubmitButton } from "@/components/auth/fields";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError, functionErrorMessage } from "@/lib/auth/errors";
import { cn } from "@/lib/utils";

type Mode = "code" | "help";

/**
 * Password recovery without email. Either the learner has the recovery code
 * they saved at first login (instant, self-service), or they ask an admin,
 * who generates a new temporary password in the admin console.
 */
export default function ForgotPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("code");
  const [email, setEmail] = useState((location.state as { email?: string } | null)?.email ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [helpSent, setHelpSent] = useState(false);

  const resetWithCode = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 8) return setError("Choose a password of at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setBusy(true);
    setError(null);
    const { error: invokeError } = await supabase.functions.invoke("account-recovery", {
      body: { email: email.trim().toLowerCase(), code, new_password: password },
    });
    setBusy(false);
    if (invokeError) {
      setError(await functionErrorMessage(invokeError));
      return;
    }
    navigate("/auth/sign-in", {
      replace: true,
      state: {
        email: email.trim().toLowerCase(),
        notice: "Password updated. Sign in with your new password — you'll get a fresh recovery code next.",
      },
    });
  };

  const askForHelp = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: rpcError } = await supabase.rpc("request_password_help", {
      p_email: email.trim().toLowerCase(),
      p_note: note || null,
    });
    setBusy(false);
    if (rpcError) setError(friendlyAuthError(rpcError));
    else setHelpSent(true);
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="No email needed."
      footer={
        <Link to="/auth/sign-in" className="text-primary underline underline-offset-4">
          Back to sign in
        </Link>
      }
    >
      <div role="tablist" aria-label="How to reset" className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1">
        {(
          [
            { id: "code", label: "I have my code", icon: KeyRound },
            { id: "help", label: "I lost my code", icon: LifeBuoy },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => {
              setMode(id);
              setError(null);
            }}
            className={cn(
              "interactive flex min-h-[2.5rem] items-center justify-center gap-2 rounded-md text-sm",
              mode === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {mode === "code" ? (
        <form onSubmit={resetWithCode} className="space-y-5" noValidate>
          <FormError>{error}</FormError>
          <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Field
            label="Recovery code"
            autoComplete="one-time-code"
            required
            placeholder="XXXX-XXXX-XXXX"
            className="figure uppercase tracking-widest"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            hint="The 12-character code you saved when you first signed in."
          />
          <div>
            <PasswordField
              label="New password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <PasswordStrength password={password} />
          </div>
          <PasswordField
            label="Confirm new password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <SubmitButton busy={busy || !email || !code || !password}>
            {busy ? "Resetting…" : "Reset password"}
          </SubmitButton>
        </form>
      ) : helpSent ? (
        <div role="status" className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-lg text-foreground">Request sent</h2>
          <p className="mt-2 text-muted-foreground">
            An admin will generate a new temporary password and share it with you directly (Slack or in
            person). You&apos;ll choose your own password the next time you sign in.
          </p>
        </div>
      ) : (
        <form onSubmit={askForHelp} className="space-y-5" noValidate>
          <FormError>{error}</FormError>
          <p className="text-sm text-muted-foreground">
            Your request goes to the admins. They&apos;ll send you a new temporary password.
          </p>
          <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Field
            label="Anything they should know? (optional)"
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. best way to reach me"
          />
          <SubmitButton busy={busy || !email}>
            {busy ? "Sending…" : "Ask an admin"}
          </SubmitButton>
        </form>
      )}
    </AuthLayout>
  );
}
