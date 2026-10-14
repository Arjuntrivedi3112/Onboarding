import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useLearnerStats } from "@/hooks/useLearnerData";
import { useProgressState } from "@/hooks/useProgress";
import { ACHIEVEMENTS, earnedAchievements } from "@/lib/achievements";
import { useAuth } from "@/lib/auth/AuthProvider";
import { track } from "@/lib/telemetry";
import { SIMULATIONS } from "@/simulations/registry";

/**
 * Awards badges as they're earned, wherever the learner is: compares what
 * the learner qualifies for against what's stored, saves anything new and
 * celebrates it once. Renders nothing.
 */
export function BadgeWatcher() {
  const { user } = useAuth();
  const progress = useProgressState();
  const { data: stats } = useLearnerStats();
  const client = useQueryClient();
  const saving = useRef(new Set<string>());

  useEffect(() => {
    if (!user || !stats) return;
    const have = new Set(stats.badges.map((b) => b.badge_id));
    const earned = earnedAchievements({
      completed: new Set(Object.keys(progress.completed)),
      simsOpened: stats.simsOpened,
      simsPassed: stats.simsPassed,
      totalSims: SIMULATIONS.length,
      streak: stats.streak,
      gotIt: stats.gotIt,
      notes: stats.notes,
    });
    const fresh = earned.filter((a) => !have.has(a.id) && !saving.current.has(a.id));
    if (fresh.length === 0) return;
    fresh.forEach((a) => saving.current.add(a.id));

    void supabase
      .from("achievements")
      .upsert(
        fresh.map((a) => ({ user_id: user.id, badge_id: a.id })),
        { onConflict: "user_id,badge_id", ignoreDuplicates: true }
      )
      .then(({ error }) => {
        if (error) {
          fresh.forEach((a) => saving.current.delete(a.id));
          return;
        }
        fresh.forEach((a) => track("badge", { meta: { badge: a.id } }));
        if (fresh.length === 1) {
          toast.success(`Badge earned: ${fresh[0].title}`, { description: fresh[0].description });
        } else {
          toast.success(`${fresh.length} badges earned`, { description: fresh.map((a) => a.title).join(", ") });
        }
        client.invalidateQueries({ queryKey: ["learner_stats", user.id] });
      });
  }, [user, stats, progress.completed, client]);

  return null;
}

export const TOTAL_BADGES = ACHIEVEMENTS.length;
