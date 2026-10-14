/**
 * Team session notes and doubts, stored in Supabase.
 *
 * This replaces the old GitHub Contents API storage, which needed a repo
 * write token in every browser. Access rules live in the database
 * (supabase/migrations/*_team_notes.sql): everyone signed in reads, admins
 * edit sessions and images, anyone can raise or resolve a doubt.
 *
 * The UI works with whole arrays, so saves diff against what is stored:
 * changed items are upserted and removed items deleted.
 */
import type { Doubt, Session } from "@/components/modules/SessionNotesModule";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

const BUCKET = "session-images";

export async function loadSessions(): Promise<Session[] | null> {
  const { data, error } = await supabase.from("team_sessions").select("id, data");
  if (error) return null;
  return (data ?? [])
    .map((row) => ({ ...(row.data as unknown as Session), id: row.id }))
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
}

export async function loadDoubts(): Promise<Doubt[] | null> {
  const { data, error } = await supabase.from("team_doubts").select("id, session_id, data");
  if (error) return null;
  return (data ?? [])
    .map((row) => ({ ...(row.data as unknown as Doubt), id: row.id, sessionId: row.session_id }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function saveSessions(sessions: Session[]): Promise<boolean> {
  const { data: existing, error: readError } = await supabase.from("team_sessions").select("id");
  if (readError) return false;
  const keep = new Set(sessions.map((s) => s.id));
  const removed = (existing ?? []).map((r) => r.id).filter((id) => !keep.has(id));

  if (sessions.length > 0) {
    const { error } = await supabase
      .from("team_sessions")
      .upsert(sessions.map((s) => ({ id: s.id, data: s as unknown as Json, updated_at: new Date().toISOString() })));
    if (error) return false;
  }
  if (removed.length > 0) {
    const { error } = await supabase.from("team_sessions").delete().in("id", removed);
    if (error) return false;
  }
  return true;
}

export async function saveDoubts(doubts: Doubt[]): Promise<boolean> {
  const { data: existing, error: readError } = await supabase.from("team_doubts").select("id, data");
  if (readError) return false;
  const stored = new Map((existing ?? []).map((r) => [r.id, JSON.stringify(r.data)]));
  const keep = new Set(doubts.map((d) => d.id));

  const changed = doubts.filter((d) => stored.get(d.id) !== JSON.stringify(d));
  const added = changed.filter((d) => !stored.has(d.id));
  const updated = changed.filter((d) => stored.has(d.id));
  const removed = [...stored.keys()].filter((id) => !keep.has(id));

  if (added.length > 0) {
    const { error } = await supabase
      .from("team_doubts")
      .insert(added.map((d) => ({ id: d.id, session_id: d.sessionId, data: d as unknown as Json })));
    if (error) return false;
  }
  for (const d of updated) {
    const { error } = await supabase
      .from("team_doubts")
      .update({ data: d as unknown as Json, updated_at: new Date().toISOString() })
      .eq("id", d.id);
    if (error) return false;
  }
  if (removed.length > 0) {
    const { error } = await supabase.from("team_doubts").delete().in("id", removed);
    if (error) return false;
  }
  return true;
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/-+/g, "-")
    .slice(0, 100);
}

/** Upload an image for a session; returns its public URL. */
export async function uploadSessionImage(sessionId: string, file: File): Promise<string | null> {
  const path = `${sanitizeFilename(sessionId)}/${Date.now()}-${sanitizeFilename(file.name)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Delete an image previously returned by uploadSessionImage. */
export async function deleteSessionImage(url: string): Promise<boolean> {
  const marker = `/object/public/${BUCKET}/`;
  const at = url.indexOf(marker);
  // Images from the old GitHub storage aren't ours to delete; just unlink them.
  if (at === -1) return true;
  const { error } = await supabase.storage.from(BUCKET).remove([decodeURIComponent(url.slice(at + marker.length))]);
  return !error;
}
