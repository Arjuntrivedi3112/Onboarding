import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/lib/auth/AuthProvider";
import { gateRedirect } from "@/lib/auth/gate";

/**
 * Route element that applies the account gate (src/lib/auth/gate.ts) to every
 * page beneath it: signed-out visitors go to sign-in, new accounts walk the
 * first-run steps in order, learners stay out of the admin console.
 */
export function AccountGate() {
  const { status, profile, isAdmin } = useAuth();
  const location = useLocation();

  const redirect = gateRedirect({ status, profile, isAdmin }, location.pathname, location.search);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" role="status" aria-live="polite">
        <span className="text-sm text-muted-foreground">Loading your journey…</span>
      </div>
    );
  }

  if (redirect) return <Navigate to={redirect} replace />;
  return <Outlet />;
}
