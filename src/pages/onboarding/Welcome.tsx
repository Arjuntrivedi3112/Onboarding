import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { firstNameFor, useAuth } from "@/lib/auth/AuthProvider";

/** Placeholder first-run screen; replaced by the full onboarding wizard. */
export default function Welcome() {
  const { profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const name = firstNameFor(profile);

  const start = async () => {
    setBusy(true);
    await updateProfile({ onboarding_completed_at: new Date().toISOString() });
    navigate("/dashboard", { replace: true });
  };

  return (
    <AuthLayout title={name ? `You're in, ${name}` : "You're in"} subtitle="Let's start your AdTech journey.">
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="interactive inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-lg bg-primary px-5 text-base text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {busy ? "Starting…" : "Start learning"}
      </button>
    </AuthLayout>
  );
}
