import { useState, type FormEvent } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Field, FormError, PasswordField, SubmitButton } from "@/components/auth/fields";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { friendlyAuthError } from "@/lib/auth/errors";

export default function SignIn() {
  const [params] = useSearchParams();
  const location = useLocation();
  const { error: accountError } = useAuth();
  const [email, setEmail] = useState((location.state as { email?: string } | null)?.email ?? "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const notice = (location.state as { notice?: string } | null)?.notice;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    // On success the account gate forwards to ?next= or the next first-run step.
    if (signInError) {
      setError(friendlyAuthError(signInError));
      setBusy(false);
    }
  };

  const next = params.get("next");

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back. Pick up right where you left off."
      footer={
        <>
          New to IQM&apos;s AdTech Journey?{" "}
          <Link to="/auth/sign-up" className="text-primary underline underline-offset-4">
            Create an account
          </Link>{" "}
          with your @iqm.com email.
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {notice && (
          <p role="status" className="rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm text-foreground">
            {notice}
          </p>
        )}
        <FormError>{error ?? accountError}</FormError>
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div>
          <PasswordField
            label="Password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Link
            to="/auth/forgot-password"
            state={{ email }}
            className="mt-2 inline-block text-sm text-primary underline underline-offset-4"
          >
            Forgot password?
          </Link>
        </div>
        <SubmitButton busy={busy || !email || !password}>
          {busy ? "Signing in…" : "Sign in"}
        </SubmitButton>
        {next && <p className="text-xs text-muted-foreground">You&apos;ll go straight back to the page you opened.</p>}
      </form>
    </AuthLayout>
  );
}
