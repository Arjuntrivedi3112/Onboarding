import { useState, type FormEvent } from "react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormError, PasswordField, PasswordStrength, SubmitButton } from "@/components/auth/fields";
import { supabase } from "@/integrations/supabase/client";
import { firstNameFor, useAuth } from "@/lib/auth/AuthProvider";
import { friendlyAuthError } from "@/lib/auth/errors";

/**
 * First sign-in for an admin-created account (or after an admin reset): the
 * temporary password is replaced with one only the learner knows.
 */
export default function SetPassword() {
  const { profile, refreshProfile, signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setBusy(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(friendlyAuthError(updateError));
      setBusy(false);
      return;
    }
    await supabase.rpc("mark_password_changed");
    await refreshProfile();
    // The gate moves on to the recovery code.
  };

  const name = firstNameFor(profile);

  return (
    <AuthLayout
      title={name ? `Welcome, ${name}` : "Welcome"}
      subtitle="First, replace the temporary password you were given with one only you know."
      footer={
        <button type="button" onClick={signOut} className="text-primary underline-offset-4 hover:underline">
          Sign out
        </button>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <FormError>{error}</FormError>
        <div>
          <PasswordField
            label="New password"
            autoComplete="new-password"
            autoFocus
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
        <SubmitButton busy={busy || !password || !confirm}>
          {busy ? "Saving…" : "Save password"}
        </SubmitButton>
      </form>
    </AuthLayout>
  );
}
