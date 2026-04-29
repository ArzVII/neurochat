import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) return null;
  return createClient(supabaseUrl, serviceRole);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return res.status(500).json({ error: "Server missing Supabase configuration" });
  }

  try {
    const { orgId } = req.query;
    if (!orgId) return res.status(400).json({ error: "orgId is required" });

    const { data: org, error: orgError } = await supabaseAdmin
      .from("organisations")
      .select("id, name, licence_type, max_seats, created_at")
      .eq("id", orgId)
      .maybeSingle();
    if (orgError) throw orgError;
    if (!org) return res.status(404).json({ error: "Organisation not found" });

    const { data: members, error: membersError } = await supabaseAdmin
      .from("org_members")
      .select("user_id, role")
      .eq("org_id", orgId);
    if (membersError) throw membersError;

    const memberIds = (members ?? []).map((m) => m.user_id);
    const [progressResult, sessionsResult] = await Promise.all([
      memberIds.length
        ? supabaseAdmin
            .from("progress")
            .select("user_id, total_sessions, completed_scenarios, earned_badges, last_active")
            .in("user_id", memberIds)
        : Promise.resolve({ data: [], error: null }),
      memberIds.length
        ? supabaseAdmin
            .from("sessions")
            .select("id, user_id, scenario_id, created_at")
            .in("user_id", memberIds)
            .order("created_at", { ascending: false })
            .limit(3000)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (progressResult.error) throw progressResult.error;
    if (sessionsResult.error) throw sessionsResult.error;

    const progressRows = progressResult.data ?? [];
    const sessionRows = sessionsResult.data ?? [];
    const progressByUser = new Map(progressRows.map((p) => [p.user_id, p]));
    const now = Date.now();
    const active7d = new Set();
    const scenarioCounts = {};

    for (const row of sessionRows) {
      const sid = row.scenario_id || "unknown";
      scenarioCounts[sid] = (scenarioCounts[sid] || 0) + 1;
      const ageMs = now - new Date(row.created_at).getTime();
      if (ageMs <= 7 * 24 * 60 * 60 * 1000) active7d.add(row.user_id);
    }

    const userStats = memberIds.map((uid) => {
      const p = progressByUser.get(uid);
      return {
        userId: uid,
        role: members.find((m) => m.user_id === uid)?.role ?? "member",
        totalSessions: p?.total_sessions ?? 0,
        completedScenarios: Array.isArray(p?.completed_scenarios) ? p.completed_scenarios.length : 0,
        badgesEarned: Array.isArray(p?.earned_badges) ? p.earned_badges.length : 0,
        lastActive: p?.last_active ?? null,
      };
    });

    const totalSessions = progressRows.reduce((sum, p) => sum + (p.total_sessions || 0), 0);
    const totals = {
      users: memberIds.length,
      totalSessions,
      avgSessionsPerUser: memberIds.length ? Number((totalSessions / memberIds.length).toFixed(2)) : 0,
      activeLast7Days: active7d.size,
    };

    const topScenarios = Object.entries(scenarioCounts)
      .map(([scenarioId, count]) => ({ scenarioId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return res.status(200).json({
      organisation: org,
      totals,
      topScenarios,
      userStats,
    });
  } catch (error) {
    console.error("Admin dashboard failed:", error);
    return res.status(500).json({ error: "Failed to load admin dashboard" });
  }
}
