import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL?.trim() || import.meta.env.SUPABASE_URL?.trim() || "";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || import.meta.env.SUPABASE_ANON_KEY?.trim() || "";

if (typeof window !== "undefined" && supabaseUrl) {
  // Helps verify which project the browser client talks to (never log secrets).
  console.log("[NeuroChat] Supabase URL:", supabaseUrl);
}

export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export function isSupabaseConfigured() {
  return Boolean(supabase);
}
