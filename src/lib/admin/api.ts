/**
 * Data access for the admin console. Reads go through admin-only database
 * functions or admin-readable tables (row-level security decides); account
 * operations that need the service role go through the admin-users edge
 * function. Every hook is react-query, keyed under ["admin", …] so a single
 * invalidation refreshes the console.
 */
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { functionErrorMessage } from "@/lib/auth/errors";
import { learnerMetrics, type CohortLite, type LearnerMetrics } from "@/lib/admin/metrics";

async function unwrap<T>(promise: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  return data as T;
}

async function invokeAdmin<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("admin-users", { body });
  if (error) throw new Error(await functionErrorMessage(error));
  return data as T;
}

export function useInvalidateAdmin() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ["admin"] });
}

export interface Cohort extends CohortLite {
  description: string | null;
  created_at: string;
}

export function useCohorts() {
  return useQuery({
    queryKey: ["admin", "cohorts"],
    queryFn: () => unwrap(supabase.from("cohorts").select("id, name, description, start_date, target_end_date, created_at").order("created_at")) as Promise<Cohort[]>,
  });
}

/** Every account with derived metrics (book %, pace, risks). */
export function useLearners() {
  const users = useQuery({ queryKey: ["admin", "users"], queryFn: () => unwrap(supabase.rpc("admin_users")) });
  const cohorts = useCohorts();
  const learners = useMemo<LearnerMetrics[]>(() => {
    const byId = new Map((cohorts.data ?? []).map((c) => [c.id, c]));
    return (users.data ?? []).map((u) => learnerMetrics(u, u.cohort_id ? byId.get(u.cohort_id) : undefined));
  }, [users.data, cohorts.data]);
  return { learners, cohorts: cohorts.data ?? [], isLoading: users.isLoading || cohorts.isLoading, error: users.error ?? cohorts.error };
}

export function useDailyActivity(days = 30) {
  return useQuery({ queryKey: ["admin", "daily", days], queryFn: () => unwrap(supabase.rpc("admin_daily_activity", { p_days: days })) });
}

export function useLessonStats() {
  return useQuery({ queryKey: ["admin", "lessons"], queryFn: () => unwrap(supabase.rpc("admin_lesson_stats")) });
}

export function useSimStats() {
  return useQuery({ queryKey: ["admin", "sims"], queryFn: () => unwrap(supabase.rpc("admin_sim_stats")) });
}

export function useChatQuestions(limit = 200) {
  return useQuery({
    queryKey: ["admin", "chat", limit],
    queryFn: () =>
      unwrap(
        supabase
          .from("chat_questions")
          .select("id, user_id, lesson_id, question, blocked, created_at")
          .order("created_at", { ascending: false })
          .limit(limit)
      ),
  });
}

export function useFeedbackComments() {
  return useQuery({
    queryKey: ["admin", "feedback"],
    queryFn: () =>
      unwrap(
        supabase
          .from("lesson_feedback")
          .select("user_id, lesson_id, helpful, comment, updated_at")
          .order("updated_at", { ascending: false })
          .limit(200)
      ),
  });
}

export function useResetRequests() {
  return useQuery({
    queryKey: ["admin", "reset_requests"],
    refetchInterval: 60_000,
    queryFn: () =>
      unwrap(
        supabase.from("password_reset_requests").select("id, email, note, status, created_at").eq("status", "pending").order("created_at")
      ),
  });
}

export function useAdminAnnouncements() {
  return useQuery({
    queryKey: ["admin", "announcements"],
    queryFn: () =>
      unwrap(supabase.from("announcements").select("id, title, body, cohort_id, published_at").order("published_at", { ascending: false })),
  });
}

/** One learner in depth, for the person page. */
export function usePersonDetail(userId: string | undefined) {
  return useQuery({
    queryKey: ["admin", "person", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const id = userId!;
      const [profile, lessons, sims, checks, events, questions, feedback, assignments] = await Promise.all([
        unwrap(supabase.from("profiles").select("*").eq("id", id).maybeSingle()),
        unwrap(supabase.from("lesson_progress").select("lesson_id, first_visited_at, completed_at, time_spent_seconds, max_scroll_pct").eq("user_id", id)),
        unwrap(supabase.from("simulation_progress").select("sim_id, runs, first_opened_at, challenge_passed_at").eq("user_id", id)),
        unwrap(supabase.from("self_checks").select("lesson_id, question_index, rating").eq("user_id", id)),
        unwrap(
          supabase.from("activity_events").select("id, type, lesson_id, sim_id, meta, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(60)
        ),
        unwrap(supabase.from("chat_questions").select("id, lesson_id, question, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(30)),
        unwrap(supabase.from("lesson_feedback").select("lesson_id, helpful, comment, updated_at").eq("user_id", id)),
        unwrap(supabase.from("assignments").select("id, target_type, target_id, due_date, note, created_at").eq("user_id", id)),
      ]);
      return { profile, lessons, sims, checks, events, questions, feedback, assignments };
    },
  });
}

/* ---------------------------------------------------------------------- */
/* Mutations                                                              */
/* ---------------------------------------------------------------------- */

export interface CreatedAccount {
  email: string;
  ok: boolean;
  password?: string;
  user_id?: string;
  error?: string;
}

export function useAdminActions() {
  const invalidate = useInvalidateAdmin();
  // Called in a fixed order on every render, so the hooks rule holds.
  const useAction = <A, R>(fn: (args: A) => Promise<R>) =>
    useMutation({ mutationFn: fn, onSuccess: () => void invalidate() });

  return {
    createUsers: useAction((args: { users: Array<{ email: string; full_name?: string; role: "admin" | "learner"; cohort_id: string | null }> }) =>
      invokeAdmin<{ results: CreatedAccount[] }>({ action: "create_users", users: args.users })
    ),
    resetPassword: useAction((userId: string) => invokeAdmin<{ email: string; password: string }>({ action: "reset_password", user_id: userId })),
    setStatus: useAction((args: { userId: string; status: "active" | "suspended" }) =>
      invokeAdmin({ action: "set_status", user_id: args.userId, status: args.status })
    ),
    deleteUser: useAction((userId: string) => invokeAdmin({ action: "delete_user", user_id: userId })),
    setRole: useAction((args: { userId: string; role: "admin" | "learner" }) =>
      unwrap(supabase.rpc("admin_set_role", { p_user: args.userId, p_role: args.role }))
    ),
    setCohort: useAction((args: { userIds: string[]; cohortId: string | null }) =>
      unwrap(supabase.rpc("admin_set_cohort", { p_users: args.userIds, p_cohort: args.cohortId as string }))
    ),
    resetProgress: useAction((userId: string) => unwrap(supabase.rpc("admin_reset_progress", { p_user: userId }))),
    assign: useAction(
      async (args: {
        userIds?: string[];
        cohortId?: string;
        targetType: "lesson" | "section" | "simulation";
        targetId: string;
        dueDate: string | null;
        note: string | null;
        assignedBy: string;
      }) => {
        const base = { target_type: args.targetType, target_id: args.targetId, due_date: args.dueDate, note: args.note, assigned_by: args.assignedBy };
        const rows: Array<typeof base & { user_id?: string; cohort_id?: string }> = args.cohortId
          ? [{ ...base, cohort_id: args.cohortId }]
          : (args.userIds ?? []).map((user_id) => ({ ...base, user_id }));
        return unwrap(supabase.from("assignments").insert(rows));
      }
    ),
    deleteAssignment: useAction((id: string) => unwrap(supabase.from("assignments").delete().eq("id", id))),
    nudge: useAction((args: { userIds: string[]; title: string; body: string; link: string | null; sentBy: string }) =>
      unwrap(
        supabase.from("notifications").insert(
          args.userIds.map((user_id) => ({ user_id, kind: "nudge", title: args.title, body: args.body || null, link: args.link, created_by: args.sentBy }))
        )
      )
    ),
    saveCohort: useAction((args: { id?: string; name: string; description: string | null; start_date: string | null; target_end_date: string | null; createdBy: string }) => {
      const row = { name: args.name, description: args.description, start_date: args.start_date, target_end_date: args.target_end_date };
      return args.id
        ? unwrap(supabase.from("cohorts").update(row).eq("id", args.id))
        : unwrap(supabase.from("cohorts").insert({ ...row, created_by: args.createdBy }));
    }),
    deleteCohort: useAction((id: string) => unwrap(supabase.from("cohorts").delete().eq("id", id))),
    announce: useAction((args: { title: string; body: string; cohortId: string | null; createdBy: string }) =>
      unwrap(supabase.from("announcements").insert({ title: args.title, body: args.body, cohort_id: args.cohortId, created_by: args.createdBy }))
    ),
    deleteAnnouncement: useAction((id: string) => unwrap(supabase.from("announcements").delete().eq("id", id))),
    dismissResetRequest: useAction((args: { id: string; by: string }) =>
      unwrap(
        supabase.from("password_reset_requests").update({ status: "dismissed", resolved_by: args.by, resolved_at: new Date().toISOString() }).eq("id", args.id)
      )
    ),
  };
}

export type { Json };
