import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Field, FormError, PasswordField, PasswordStrength, SubmitButton } from "@/components/auth/fields";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError } from "@/lib/auth/errors";

const DOMAIN_MESSAGE =
  "Only @iqm.com addresses can create an account here. If you're outside IQM, ask an admin to add you.";

export default function SignUp() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const mismatch = touched && confirm.length > 0 && confirm !== password;
  const tooShort = touched && password.length > 0 && password.length < 8;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (password.length < 8 || password !== confirm || !fullName.trim()) return;
    setBusy(true);
    setError(null);

    const normalized = email.trim().toLowerCase();
    const { data: allowed, error: checkError } = await supabase.rpc("can_self_register", { p_email: normalized });
    if (checkError) {
      setError(friendlyAuthError(checkError));
      setBusy(false);
      return;
    }
    if (!allowed) {
      setError(DOMAIN_MESSAGE);
      setBusy(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: normalized,
      password,
      options: { data: { full_name: fullName.trim() } },
    });
    if (signUpError) {
      setError(friendlyAuthError(signUpError));
      setBusy(false);
      return;
    }
    if (!data.session) {
      // Email confirmation is still switched on in Supabase; there is no email
      // to wait for in this product, so say so plainly.
      navigate("/auth/sign-in", {
        replace: true,
        state: { email: normalized, notice: "Account created. An admin needs to activate it before you can sign in." },
      });
    }
    // With a session, the account gate moves straight on to the recovery code.
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Use your @iqm.com email. It takes under a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/auth/sign-in" className="text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <FormError>{error}</FormError>
        <Field
          label="Full name"
          autoComplete="name"
          required
          autoFocus
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={touched && !fullName.trim() ? "Tell us what to call you." : undefined}
        />
        <Field
          label="Work email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder="you@iqm.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div>
          <PasswordField
            label="Password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint="At least 8 characters."
            error={tooShort ? "Use at least 8 characters." : undefined}
          />
          <PasswordStrength password={password} />
        </div>
        <PasswordField
          label="Confirm password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={mismatch ? "Passwords don't match." : undefined}
        />
        <SubmitButton busy={busy || !email || !password || !confirm}>
          {busy ? "Creating your account…" : "Create account"}
        </SubmitButton>
      </form>
    </AuthLayout>
  );
}
