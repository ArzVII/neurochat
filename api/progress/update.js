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
    const {
      userId,
      completedScenarios = [],
      earnedBadges = [],
      totalSessions = 0,
      unlockedContent = [],
      moodHistory = [],
      mood,
      hasOnboarded,
      preparePlan,
      showHints,
    } = body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const { error: progressError } = await supabaseAdmin.from("progress").upsert({
      user_id: userId,
      completed_scenarios: completedScenarios,
      earned_badges: earnedBadges,
      total_sessions: totalSessions,
      unlocked_content: unlockedContent,
      last_active: new Date().toISOString(),
    });

    if (progressError) throw progressError;

    const profilePayload = {
      id: userId,
      has_onboarded: Boolean(hasOnboarded),
    };
    if (moodHistory.length > 0 || mood) {
      profilePayload.mood_history = moodHistory;
      profilePayload.last_mood = mood ?? moodHistory[moodHistory.length - 1] ?? null;
    }
    if (preparePlan !== undefined) {
      profilePayload.prepare_plan = preparePlan;
    }
    if (typeof showHints === "boolean") {
      profilePayload.show_hints = showHints;
    }

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(profilePayload);
    if (profileError) throw profileError;

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Progress update failed:", error);
    return res.status(500).json({ error: "Failed to update progress" });
  }
}
