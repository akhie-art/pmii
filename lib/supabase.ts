import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured =
  supabaseUrl &&
  supabaseUrl !== "https://your-supabase-url.supabase.co" &&
  supabaseAnonKey &&
  supabaseAnonKey !== "your-supabase-anon-key";

if (!isSupabaseConfigured) {
  console.warn(
    "⚠️ Supabase is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your env files. Falling back to LocalStorage."
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
