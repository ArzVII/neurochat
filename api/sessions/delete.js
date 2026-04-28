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
    const { userId, sessionId } = body;
    if (!userId || !sessionId) {
      return res.status(400).json({ error: "userId and sessionId are required" });
    }

    const { error } = await supabaseAdmin.from("sessions").delete().eq("id", sessionId).eq("user_id", userId);
    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Session delete failed:", error);
    return res.status(500).json({ error: "Failed to delete session" });
  }
}
