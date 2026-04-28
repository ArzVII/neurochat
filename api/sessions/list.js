import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) return null;
  return createClient(supabaseUrl, serviceRole);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return res.status(500).json({ error: "Server missing Supabase configuration" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};
    const { userId } = body;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const { data, error } = await supabaseAdmin
      .from("sessions")
      .select("id, scenario_id, messages, feedback, mood, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(80);

    if (error) throw error;
    return res.status(200).json({ sessions: data ?? [] });
  } catch (error) {
    console.error("Sessions list failed:", error);
    return res.status(500).json({ error: "Failed to list sessions" });
  }
}
