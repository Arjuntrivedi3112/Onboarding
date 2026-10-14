/**
 * Where a visitor is allowed to be, as a pure function of their account state
 * and the path they asked for. The <AccountGate> route element applies it;
 * keeping the policy here makes every redirect unit-testable.
 *
 * The order of first-run steps is fixed:
 *   sign in → set your own password (admin-created accounts only)
 *          → save a recovery code → onboarding → the journey
 */

export type AuthStatus = "loading" | "signed_out" | "signed_in";

export interface GateProfile {
  must_change_password: boolean;
  recovery_code_saved_at: string | null;
  onboarding_completed_at: string | null;
}

export interface GateState {
  status: AuthStatus;
  profile: GateProfile | null;
  isAdmin: boolean;
}

/** Pages anyone can open while signed out. */
export const PUBLIC_AUTH_PATHS = ["/auth/sign-in", "/auth/sign-up", "/auth/forgot-password"];

export const SET_PASSWORD_PATH = "/auth/set-password";
export const RECOVERY_CODE_PATH = "/auth/recovery-code";
export const WELCOME_PATH = "/welcome";
export const HOME_PATH = "/dashboard";

/** The first-run step this account still owes, if any. */
export function pendingStep(profile: GateProfile): string | null {
  if (profile.must_change_password) return SET_PASSWORD_PATH;
  if (!profile.recovery_code_saved_at) return RECOVERY_CODE_PATH;
  if (!profile.onboarding_completed_at) return WELCOME_PATH;
  return null;
}

/** Only same-site paths may be used as a post-sign-in destination. */
export function safeNext(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/auth/")) return null;
  return next;
}

/**
 * Returns the path to redirect to, or null to render what was asked for.
 * `search` is the current query string, used to honour `?next=`.
 */
export function gateRedirect(state: GateState, pathname: string, search = ""): string | null {
  if (state.status === "loading") return null;
  const isPublicAuth = PUBLIC_AUTH_PATHS.includes(pathname);

  if (state.status === "signed_out" || !state.profile) {
    if (isPublicAuth) return null;
    const target = pathname + search;
    return target === "/" || target === HOME_PATH
      ? "/auth/sign-in"
      : `/auth/sign-in?next=${encodeURIComponent(target)}`;
  }

  const step = pendingStep(state.profile);
  if (step) return pathname === step ? null : step;

  // Fully set up: first-run pages are done, sign-in pages forward onwards.
  if (isPublicAuth) {
    return safeNext(new URLSearchParams(search).get("next")) ?? HOME_PATH;
  }
  if (pathname === SET_PASSWORD_PATH || pathname === RECOVERY_CODE_PATH) return HOME_PATH;
  if (pathname.startsWith("/admin") && !state.isAdmin) return HOME_PATH;
  return null;
}
