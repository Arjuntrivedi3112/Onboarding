import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { track } from "@/lib/telemetry";

export type SelfRating = "got_it" | "partly" | "missed";

/** The learner's self-check ratings for one lesson, by question index. */
export function useSelfChecks(lessonId: string) {
  const { user } = useAuth();
  const client = useQueryClient();
  const key = ["self_checks", user?.id, lessonId];

  const query = useQuery({
    queryKey: key,
    enabled: Boolean(user),
    queryFn: async () => {
      const { data } = await supabase
        .from("self_checks")
        .select("question_index, rating")
        .eq("user_id", user!.id)
        .eq("lesson_id", lessonId);
      return Object.fromEntries((data ?? []).map((r) => [r.question_index, r.rating as SelfRating])) as Record<
        number,
        SelfRating
      >;
    },
  });

  const rate = useMutation({
    mutationFn: async ({ index, rating }: { index: number; rating: SelfRating }) => {
      const { error } = await supabase.from("self_checks").upsert(
        { user_id: user!.id, lesson_id: lessonId, question_index: index, rating, updated_at: new Date().toISOString() },
        { onConflict: "user_id,lesson_id,question_index" }
      );
      if (error) throw error;
      track("self_check", { lessonId, meta: { index, rating } });
    },
    onMutate: ({ index, rating }) => {
      client.setQueryData<Record<number, SelfRating>>(key, (old) => ({ ...(old ?? {}), [index]: rating }));
    },
  });

  return { ratings: query.data ?? {}, rate: rate.mutate };
}

export function useLessonFeedback(lessonId: string) {
  const { user } = useAuth();
  const client = useQueryClient();
  const key = ["lesson_feedback", user?.id, lessonId];

  const query = useQuery({
    queryKey: key,
    enabled: Boolean(user),
    queryFn: async () => {
      const { data } = await supabase
        .from("lesson_feedback")
        .select("helpful, comment")
        .eq("user_id", user!.id)
        .eq("lesson_id", lessonId)
        .maybeSingle();
      return data ?? null;
    },
  });

  const save = useMutation({
    mutationFn: async (value: { helpful: boolean; comment: string | null }) => {
      const { error } = await supabase.from("lesson_feedback").upsert(
        { user_id: user!.id, lesson_id: lessonId, ...value, updated_at: new Date().toISOString() },
        { onConflict: "user_id,lesson_id" }
      );
      if (error) throw error;
      track("feedback", { lessonId, meta: { helpful: value.helpful } });
    },
    onSuccess: (_d, value) => client.setQueryData(key, value),
  });

  return { feedback: query.data ?? null, save: save.mutateAsync, saving: save.isPending };
}

export function useLessonNote(lessonId: string) {
  const { user } = useAuth();
  const client = useQueryClient();
  const key = ["lesson_notes", user?.id, lessonId];

  const query = useQuery({
    queryKey: key,
    enabled: Boolean(user),
    queryFn: async () => {
      const { data } = await supabase
        .from("lesson_notes")
        .select("body, updated_at")
        .eq("user_id", user!.id)
        .eq("lesson_id", lessonId)
        .maybeSingle();
      return data ?? null;
    },
  });

  const save = useMutation({
    mutationFn: async (body: string) => {
      if (!body.trim()) {
        const { error } = await supabase.from("lesson_notes").delete().eq("user_id", user!.id).eq("lesson_id", lessonId);
        if (error) throw error;
        return null;
      }
      const updated_at = new Date().toISOString();
      const { error } = await supabase
        .from("lesson_notes")
        .upsert({ user_id: user!.id, lesson_id: lessonId, body, updated_at }, { onConflict: "user_id,lesson_id" });
      if (error) throw error;
      return { body, updated_at };
    },
    onSuccess: (value) => {
      client.setQueryData(key, value);
      client.invalidateQueries({ queryKey: ["all_lesson_notes"] });
    },
  });

  return { note: query.data ?? null, loaded: query.isFetched || !user, save: save.mutateAsync, saving: save.isPending, error: save.error };
}
