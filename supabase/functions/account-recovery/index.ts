import { corsHeaders, json, serviceClient } from "../_shared/http.ts";

/**
 * Self-service password reset without email: the learner proves who they are
 * with the one-time recovery code they saved at first login.
 *
 * The code check, single-use consumption and the five-failures-per-hour
 * lockout all live in the consume_recovery_code() database function; this
 * function only adds the password update, which needs the service role.
 * Responses never reveal whether an email has an account.
 */

const MIN_PASSWORD = 8;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { email?: string; code?: string; new_password?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const code = String(body.code ?? "").trim();
  const password = String(body.new_password ?? "");

  if (!email || !code) return json({ error: "Enter your email and recovery code." }, 400);
  if (password.length < MIN_PASSWORD) {
    return json({ error: `Choose a password of at least ${MIN_PASSWORD} characters.` }, 400);
  }

  const admin = serviceClient();
  const { data: userId, error } = await admin.rpc("consume_recovery_code", { p_email: email, p_code: code });

  if (error) {
    if (/RATE_LIMITED/.test(error.message)) {
      return json({ error: "Too many attempts. Wait an hour, or ask an admin for a new password." }, 429);
    }
    console.error("consume_recovery_code failed", error);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }

  if (!userId) {
    return json({ error: "That email and recovery code don't match." }, 400);
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(userId as string, { password });
  if (updateError) {
    console.error("password update failed", updateError);
    return json({ error: "Your code was accepted but the password couldn't be saved. Ask an admin for help." }, 500);
  }

  return json({ ok: true });
});
