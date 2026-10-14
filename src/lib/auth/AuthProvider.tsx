import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";
import { setProgressScope } from "@/lib/progress";
import { syncAccount } from "@/lib/sync/progressSync";
import { flushTelemetry, setTelemetryUser, trackSessionStart } from "@/lib/telemetry";
import type { AuthStatus } from "@/lib/auth/gate";

export type Profile = Tables<"profiles">;
export type AppRole = "admin" | "learner";

interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: AppRole;
  isAdmin: boolean;
  /** Set when the account could not be loaded (e.g. suspended, network). */
  error: string | null;
  refreshProfile: () => Promise<Profile | null>;
  /** Update the signed-in learner's own profile (columns RLS allows). */
  updateProfile: (patch: TablesUpdate<"profiles">) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Owns the Supabase session and the learner's profile and role.
 *
 * Everything else reads `useAuth()`. The provider also scopes the local
 * progress store to the account, and on each sign-in stamps first login and
 * the browser's time zone (used for streaks and weekly goals).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole>("learner");
  const [error, setError] = useState<string | null>(null);
  const loadedFor = useRef<string | null>(null);

  const loadAccount = useCallback(async (user: User): Promise<Profile | null> => {
    const [profileRes, roleRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
    ]);
    if (profileRes.error || !profileRes.data) {
      setError(profileRes.error?.message ?? "Your account profile could not be loaded.");
      return null;
    }
    const loaded = profileRes.data;
    if (loaded.status === "suspended") {
      setError("This account is suspended. Ask an admin to reactivate it.");
      await supabase.auth.signOut();
      return null;
    }
    setError(null);
    setProfile(loaded);
    setRole((roleRes.data?.role as AppRole) ?? "learner");
    return loaded;
  }, []);

  // Session lifecycle.
  useEffect(() => {
    let active = true;

    const apply = async (next: Session | null) => {
      if (!active) return;
      setSession(next);
      if (!next?.user) {
        loadedFor.current = null;
        setProfile(null);
        setRole("learner");
        await syncAccount(null);
        setTelemetryUser(null);
        setProgressScope(null);
        setStatus("signed_out");
        return;
      }
      // Token refreshes fire auth events too; only reload on a new user.
      if (loadedFor.current === next.user.id) return;
      loadedFor.current = next.user.id;
      setProgressScope(next.user.id);
      const loaded = await loadAccount(next.user);
      if (!active) return;
      if (loaded) {
        setTelemetryUser(loaded.id);
        trackSessionStart(loaded.id);
        void syncAccount(loaded.id);
      }
      setStatus(loaded ? "signed_in" : "signed_out");
    };

    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      // Defer: calling Supabase inside this callback can deadlock its lock.
      setTimeout(() => apply(next), 0);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [loadAccount]);

  // First-login stamp and time zone, once per signed-in account.
  useEffect(() => {
    if (!profile) return;
    const patch: TablesUpdate<"profiles"> = {};
    if (!profile.first_login_at) patch.first_login_at = new Date().toISOString();
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && tz !== profile.timezone) patch.timezone = tz;
    } catch {
      // Older browsers: keep UTC.
    }
    if (Object.keys(patch).length === 0) return;
    supabase
      .from("profiles")
      .update(patch)
      .eq("id", profile.id)
      .then(({ error: updateError }) => {
        if (!updateError) setProfile((p) => (p ? { ...p, ...patch } : p));
      });
    // Runs when the account changes, not on every profile edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    return loadAccount(data.user);
  }, [loadAccount]);

  const updateProfile = useCallback(
    async (patch: TablesUpdate<"profiles">) => {
      if (!profile) return;
      const { error: updateError } = await supabase.from("profiles").update(patch).eq("id", profile.id);
      if (updateError) throw updateError;
      setProfile((p) => (p ? { ...p, ...patch } as Profile : p));
    },
    [profile]
  );

  const signOut = useCallback(async () => {
    // Send queued progress and events while the session can still write them.
    await Promise.all([syncAccount(null), flushTelemetry()]);
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      user: session?.user ?? null,
      profile,
      role,
      isAdmin: role === "admin",
      error,
      refreshProfile,
      updateProfile,
      signOut,
    }),
    [status, session, profile, role, error, refreshProfile, updateProfile, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}

/** Initials for an avatar: "Ada Lovelace" → "AL", falling back to the email. */
export function initialsFor(profile: Pick<Profile, "full_name" | "email"> | null): string {
  if (!profile) return "?";
  const source = profile.full_name?.trim() || profile.email.split("@")[0];
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : source.slice(0, 2)).toUpperCase();
}

/** First name for greetings. */
export function firstNameFor(profile: Pick<Profile, "full_name" | "email"> | null): string | null {
  const name = profile?.full_name?.trim();
  if (name) return name.split(/\s+/)[0];
  return null;
}
