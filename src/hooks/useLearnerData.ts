import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { currentStreak, localDay, shiftDay, weekStart } from "@/lib/achievements";

/**
 * Everything the dashboard and profile need about the signed-in learner
 * beyond lesson progress (which lives in the local store, see useProgress).
 */
export function useLearnerStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["learner_stats", user?.id],
    enabled: Boolean(user),
    staleTime: 30_000,
    queryFn: async () => {
      const since = shiftDay(localDay(), -90);
      const [days, checks, notes, sims, badges, time] = await Promise.all([
        supabase.from("daily_activity").select("day, reading_seconds").eq("user_id", user!.id).gte("day", since),
        supabase.from("self_checks").select("rating").eq("user_id", user!.id),
        supabase.from("lesson_notes").select("lesson_id").eq("user_id", user!.id),
        supabase.from("simulation_progress").select("sim_id, challenge_passed_at").eq("user_id", user!.id),
        supabase.from("achievements").select("badge_id, earned_at").eq("user_id", user!.id),
        supabase.from("lesson_progress").select("time_spent_seconds").eq("user_id", user!.id),
      ]);
      const dayRows = days.data ?? [];
      const monday = weekStart();
      return {
        activeDays: dayRows.map((d) => d.day),
        streak: currentStreak(dayRows.map((d) => d.day)),
        weekMinutes: Math.round(dayRows.filter((d) => d.day >= monday).reduce((a, d) => a + d.reading_seconds, 0) / 60),
        gotIt: (checks.data ?? []).filter((c) => c.rating === "got_it").length,
        selfChecks: (checks.data ?? []).length,
        notes: (notes.data ?? []).length,
        simsOpened: (sims.data ?? []).length,
        simsPassed: (sims.data ?? []).filter((s) => s.challenge_passed_at).length,
        badges: badges.data ?? [],
        totalMinutes: Math.round((time.data ?? []).reduce((a, r) => a + (r.time_spent_seconds ?? 0), 0) / 60),
      };
    },
  });
}

export interface AssignmentRow {
  id: string;
  target_type: "lesson" | "section" | "simulation";
  target_id: string;
  due_date: string | null;
  note: string | null;
  created_at: string;
}

export function useMyAssignments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my_assignments", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      // RLS returns this learner's own and their cohort's assignments.
      const { data } = await supabase
        .from("assignments")
        .select("id, target_type, target_id, due_date, note, created_at")
        .order("due_date", { ascending: true });
      return (data ?? []) as AssignmentRow[];
    },
  });
}

export function useAnnouncements() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["announcements", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data } = await supabase
        .from("announcements")
        .select("id, title, body, published_at")
        .order("published_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });
}

export function useNotifications() {
  const { user } = useAuth();
  const client = useQueryClient();
  const key = ["notifications", user?.id];

  const query = useQuery({
    queryKey: key,
    enabled: Boolean(user),
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, kind, title, body, link, created_at, read_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user!.id).is("read_at", null);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });

  const items = query.data ?? [];
  return { items, unread: items.filter((n) => !n.read_at).length, markAllRead: markAllRead.mutate };
}
