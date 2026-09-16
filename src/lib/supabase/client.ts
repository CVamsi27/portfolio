import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null | undefined;

/**
 * Supabase renamed API keys: new projects issue a *publishable* key
 * (sb_publishable_…) instead of the legacy *anon* key. Both work here —
 * publishable takes precedence.
 */
function publicKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && publicKey());
}

/** Browser client, or null when env vars are missing (local-only mode). */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (cached === undefined) {
    cached = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, publicKey()!);
  }
  return cached;
}
