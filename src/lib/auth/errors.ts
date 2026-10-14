/**
 * Turns auth and edge-function failures into sentences a new hire can act on.
 * Supabase error text is written for developers ("Database error saving new
 * user"); none of it should reach the screen verbatim.
 */

export function friendlyAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : String((error as { message?: string })?.message ?? error ?? "");
  const m = message.toLowerCase();

  if (m.includes("invalid login credentials")) return "That email and password don't match.";
  if (m.includes("banned") || m.includes("suspended")) return "This account is suspended. Ask an admin to reactivate it.";
  if (m.includes("database error saving new user") || m.includes("signup_not_allowed")) {
    return "Only @iqm.com addresses can create an account. If you're outside IQM, ask an admin to add you.";
  }
  if (m.includes("already registered") || m.includes("already exists")) {
    return "An account with this email already exists. Sign in instead, or use Forgot password.";
  }
  if (m.includes("should be different")) return "Choose a password you haven't used for this account.";
  if (m.includes("password should be at least") || m.includes("weak")) {
    return "That password is too short or too easy to guess. Use at least 8 characters.";
  }
  if (m.includes("email not confirmed")) {
    return "This account isn't activated yet. Ask an admin to check it in the admin console.";
  }
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Wait a minute and try again.";
  if (m.includes("failed to fetch") || m.includes("network")) {
    return "Can't reach the server. Check your connection and try again.";
  }
  return message || "Something went wrong. Please try again.";
}

/**
 * supabase.functions.invoke reports non-2xx responses as a generic
 * FunctionsHttpError; the useful message is in the JSON body.
 */
export async function functionErrorMessage(error: unknown): Promise<string> {
  const context = (error as { context?: Response })?.context;
  if (context && typeof context.json === "function") {
    try {
      const body = await context.clone().json();
      if (body?.error) return String(body.error);
    } catch {
      // Not JSON; fall through.
    }
  }
  return friendlyAuthError(error);
}
