import { useEffect, useState } from "react";

import sessionsData from "../../data/sessions/sessions.json";
import doubtsData from "../../data/sessions/doubts.json";
import type { Doubt, Session } from "@/components/modules/SessionNotesModule";
import { isGitHubConfigured, loadDoubtsFromGitHub, loadSessionsFromGitHub } from "@/lib/githubStorage";

/**
 * Session notes, seeded from the committed JSON and refreshed from GitHub when
 * a token is configured.
 *
 * This deliberately starts with the local data already in state rather than
 * blocking on the network: previously the whole app was gated behind this
 * fetch, so a slow or failing GitHub call left the entire journey showing a
 * loading string. Now only the notes view waits, and it waits with content
 * already on screen.
 */
export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>(sessionsData as Session[]);
  const [doubts, setDoubts] = useState<Doubt[]>(doubtsData as Doubt[]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!isGitHubConfigured()) return;

    let cancelled = false;
    setIsRefreshing(true);
    setFailed(false);

    Promise.all([loadSessionsFromGitHub(), loadDoubtsFromGitHub()])
      .then(([loadedSessions, loadedDoubts]) => {
        if (cancelled) return;
        if (loadedSessions) setSessions(loadedSessions);
        if (loadedDoubts) setDoubts(loadedDoubts);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setIsRefreshing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  return {
    sessions,
    doubts,
    setSessions,
    setDoubts,
    isRefreshing,
    failed,
    retry: () => setReloadToken((n) => n + 1),
  };
}
