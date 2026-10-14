import { corsHeaders, generatePassword, getCaller, json, serviceClient } from "../_shared/http.ts";

/**
 * Admin-only account operations that need the service role:
 *   create_users     — provision and create accounts with generated passwords
 *   reset_password   — issue a new temporary password (forces a change)
 *   set_status       — suspend / reactivate (bans the auth user)
 *   delete_user      — remove the account and all its data
 *
 * Nothing here sends email. Generated passwords are returned once to the
 * admin's browser to share directly, and are never stored.
 */

type NewUser = { email: string; full_name?: string; role?: "admin" | "learner"; cohort_id?: string | null };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MAX_BATCH = 200;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const caller = await getCaller(req);
  if (!caller) return json({ error: "Sign in required" }, 401);

  const admin = serviceClient();
  const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", caller.id).maybeSingle();
  if (roleRow?.role !== "admin") return json({ error: "Admins only" }, 403);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  switch (body.action) {
    case "create_users":
      return createUsers(admin, caller.id, body.users as NewUser[]);
    case "reset_password":
      return resetPassword(admin, caller.id, String(body.user_id ?? ""));
    case "set_status":
      return setStatus(admin, caller.id, String(body.user_id ?? ""), String(body.status ?? ""));
    case "delete_user":
      return deleteUser(admin, caller.id, String(body.user_id ?? ""));
    default:
      return json({ error: "Unknown action" }, 400);
  }
});

async function createUsers(admin: ReturnType<typeof serviceClient>, callerId: string, users: NewUser[]) {
  if (!Array.isArray(users) || users.length === 0) return json({ error: "No users given" }, 400);
  if (users.length > MAX_BATCH) return json({ error: `At most ${MAX_BATCH} people per batch` }, 400);

  const results: Array<{ email: string; ok: boolean; password?: string; user_id?: string; error?: string }> = [];

  for (const raw of users) {
    const email = String(raw?.email ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      results.push({ email, ok: false, error: "Not a valid email address" });
      continue;
    }
    const role = raw.role === "admin" ? "admin" : "learner";
    const fullName = raw.full_name?.trim() || null;

    // Record the provision first: the sign-up trigger trusts only this table.
    const { error: provisionError } = await admin.from("account_provisions").upsert({
      email,
      role,
      cohort_id: raw.cohort_id || null,
      full_name: fullName,
      created_by: callerId,
      consumed_at: null,
    });
    if (provisionError) {
      results.push({ email, ok: false, error: provisionError.message });
      continue;
    }

    const password = generatePassword();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: fullName ? { full_name: fullName } : {},
    });

    if (error || !data.user) {
      await admin.from("account_provisions").delete().eq("email", email).is("consumed_at", null);
      const message = /already/i.test(error?.message ?? "") ? "An account with this email already exists" : error?.message;
      results.push({ email, ok: false, error: message ?? "Could not create account" });
      continue;
    }

    results.push({ email, ok: true, password, user_id: data.user.id });
  }

  return json({ results });
}

async function resetPassword(admin: ReturnType<typeof serviceClient>, callerId: string, userId: string) {
  if (!userId) return json({ error: "user_id required" }, 400);
  const password = generatePassword();
  const { data, error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error || !data.user) return json({ error: error?.message ?? "User not found" }, 400);

  await admin.from("profiles").update({ must_change_password: true }).eq("id", userId);
  await admin
    .from("password_reset_requests")
    .update({ status: "resolved", resolved_by: callerId, resolved_at: new Date().toISOString() })
    .eq("email", (data.user.email ?? "").toLowerCase())
    .eq("status", "pending");

  return json({ email: data.user.email, password });
}

async function setStatus(admin: ReturnType<typeof serviceClient>, callerId: string, userId: string, status: string) {
  if (!userId || !["active", "suspended"].includes(status)) return json({ error: "user_id and status required" }, 400);
  if (userId === callerId && status === "suspended") return json({ error: "You can't suspend yourself" }, 400);

  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: status === "suspended" ? "876000h" : "none",
  });
  if (error) return json({ error: error.message }, 400);
  await admin.from("profiles").update({ status }).eq("id", userId);
  return json({ ok: true });
}

async function deleteUser(admin: ReturnType<typeof serviceClient>, callerId: string, userId: string) {
  if (!userId) return json({ error: "user_id required" }, 400);
  if (userId === callerId) return json({ error: "You can't delete your own account" }, 400);

  const { data: target } = await admin.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
  if (target?.role === "admin") {
    const { count } = await admin.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin");
    if ((count ?? 0) <= 1) return json({ error: "Can't delete the last admin" }, 400);
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return json({ error: error.message }, 400);
  return json({ ok: true });
}
