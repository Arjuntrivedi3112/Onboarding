import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { track } from "@/lib/telemetry";

export interface SimProgressRow {
  sim_id: string;
  runs: number;
  first_opened_at: string;
  last_opened_at: string;
  challenge_passed_at: string | null;
}

/** The signed-in learner's Lab progress, keyed by simulator id. */
export function useSimProgress() {
  const { user } = useAuth();
  const client = useQueryClient();
  const key = ["simulation_progress", user?.id];

  const query = useQuery({
    queryKey: key,
    enabled: Boolean(user),
    queryFn: async () => {
      const { data } = await supabase
        .from("simulation_progress")
        .select("sim_id, runs, first_opened_at, last_opened_at, challenge_passed_at")
        .eq("user_id", user!.id);
      return Object.fromEntries((data ?? []).map((r) => [r.sim_id, r as SimProgressRow])) as Record<string, SimProgressRow>;
    },
  });

  const recordOpen = useCallback(
    async (simId: string) => {
      track("sim_open", { simId });
      await supabase.rpc("record_sim_open", { p_sim_id: simId });
      client.invalidateQueries({ queryKey: key });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client, user?.id]
  );

  const recordPass = useCallback(
    async (simId: string) => {
      track("sim_pass", { simId });
      const now = new Date().toISOString();
      client.setQueryData<Record<string, SimProgressRow>>(key, (old) => ({
        ...(old ?? {}),
        [simId]: {
          sim_id: simId,
          runs: old?.[simId]?.runs ?? 1,
          first_opened_at: old?.[simId]?.first_opened_at ?? now,
          last_opened_at: now,
          challenge_passed_at: old?.[simId]?.challenge_passed_at ?? now,
        },
      }));
      await supabase.rpc("record_sim_pass", { p_sim_id: simId });
      client.invalidateQueries({ queryKey: key });
      client.invalidateQueries({ queryKey: ["achievements"] });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client, user?.id]
  );

  return { progress: query.data ?? {}, loaded: query.isFetched, recordOpen, recordPass };
}
