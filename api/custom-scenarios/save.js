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
    const { userId, title, description, opener, ai_personality, suggested_replies } = body;
    if (!userId || !title || !opener) {
      return res.status(400).json({ error: "userId, title, opener required" });
    }

    const { data, error } = await supabaseAdmin
      .from("custom_scenarios")
      .insert({
        user_id: userId,
        title,
        description: description ?? "",
        opener,
        ai_personality: ai_personality ?? "",
        suggested_replies: suggested_replies ?? [],
      })
      .select("id")
      .single();

    if (error) throw error;
    return res.status(200).json({ ok: true, id: data.id });
  } catch (error) {
    console.error("Custom scenario save failed:", error);
    return res.status(500).json({ error: "Failed to save custom scenario" });
  }
}
