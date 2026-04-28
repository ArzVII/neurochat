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
    const { userId, scenarioId, messages, feedback, mood } = body;

    if (!userId || !scenarioId || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "userId, scenarioId, and messages[] are required" });
    }

    const { data, error } = await supabaseAdmin
      .from("sessions")
      .insert({
        user_id: userId,
        scenario_id: scenarioId,
        messages,
        feedback,
        mood: mood ?? null,
      })
      .select("id, created_at")
      .single();

    if (error) throw error;
    return res.status(200).json({ ok: true, session: data });
  } catch (error) {
    console.error("Session save failed:", error);
    return res.status(500).json({ error: "Failed to save session" });
  }
}
