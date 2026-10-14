/**
 * Demo backend for `npm run dev:demo`: the in-memory Supabase fake, seeded
 * with a believable team so every screen — including the admin console —
 * has something to show. Vite aliases the real client to this file only in
 * demo mode (see vite.config.ts).
 */
import { fakeDb, fakeSupabase } from "@/demo/fakeSupabase";
import { seedDemo } from "@/demo/seed";

seedDemo(fakeDb);

export const supabase = fakeSupabase;
