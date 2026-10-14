import { AuthLayout } from "@/components/auth/AuthLayout";
import { RecoveryCodePanel } from "@/components/auth/RecoveryCodePanel";
import { useAuth } from "@/lib/auth/AuthProvider";

/** First-run step: save a recovery code so a forgotten password never blocks you. */
export default function RecoveryCode() {
  const { profile, refreshProfile } = useAuth();
  return (
    <AuthLayout
      title="Save your recovery code"
      subtitle="We never send emails, so this code is how you reset a forgotten password on your own."
    >
      <RecoveryCodePanel email={profile?.email ?? ""} onSaved={async () => void (await refreshProfile())} />
    </AuthLayout>
  );
}
