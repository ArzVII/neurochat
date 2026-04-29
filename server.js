import express from "express";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const port = process.env.PORT || 8787;
const apiKey = process.env.ANTHROPIC_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!apiKey) {
  console.warn("Missing ANTHROPIC_API_KEY in .env. Claude requests will fail until it is set.");
}

const anthropic = new Anthropic({ apiKey });
const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey ? createClient(supabaseUrl, supabaseServiceRoleKey) : null;

app.use(express.json());

if (!supabaseAdmin) {
  console.warn("Missing Supabase server credentials. Persistence endpoints will fail until configured.");
}

function requireSupabase(res) {
  if (!supabaseAdmin) {
    res.status(500).json({ error: "Server missing Supabase configuration" });
    return false;
  }
  return true;
}

function buildSystemPrompt(scenario) {
  return [
    "You are roleplaying as the other person in a NeuroChat social-practice scenario.",
    "Stay fully in character as the scenario partner.",
    "Respond naturally to anything the user says, even if they go off-script.",
    "Use a calm, neurodivergent-friendly tone: clear, supportive, non-judgmental, and never patronizing.",
    "Keep replies age-appropriate and realistic for the scenario context.",
    "Do not provide meta-commentary about being an AI or about training.",
    "Keep responses concise conversational turns (1-3 short paragraphs max).",
    "",
    `Scenario title: ${scenario?.title ?? "Unknown scenario"}`,
    `Scenario category: ${scenario?.category ?? "Unknown category"}`,
    `Scenario description: ${scenario?.description ?? "No description provided"}`,
    `Scenario opener: ${scenario?.opener ?? "No opener provided"}`,
    `How you should behave as the AI partner: ${scenario?.partnerBrief ?? "Respond naturally and kindly, staying appropriate for the scenario."}`,
  ].join("\n");
}

function toClaudeMessages(messages) {
  return (messages || [])
    .filter((message) => message?.sender === "user" || message?.sender === "ai")
    .map((message) => ({
      role: message.sender === "ai" ? "assistant" : "user",
      content: message.text ?? "",
    }));
}

function stripJsonFence(raw) {
  return raw.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
}

async function claudeText(system, userPrompt, maxTokens = 900) {
  const claudeResponse = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: userPrompt }],
  });
  return claudeResponse.content
    ?.filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

app.post("/api/conversation", async (req, res) => {
  try {
    const { scenario, messages } = req.body ?? {};

    if (!scenario || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "scenario and non-empty messages[] are required" });
    }

    const claudeResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      system: buildSystemPrompt(scenario),
      messages: toClaudeMessages(messages),
    });

    const text = claudeResponse.content
      ?.filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n")
      .trim();

    if (!text) {
      return res.status(502).json({ error: "Claude returned an empty response" });
    }

    return res.json({ reply: text });
  } catch (error) {
    console.error("Conversation endpoint failed:", error);
    return res.status(500).json({ error: "Failed to generate conversation response" });
  }
});

app.post("/api/progress/update", async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
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
      pacingMode,
    } = req.body ?? {};

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const progressPayload = {
      user_id: userId,
      completed_scenarios: completedScenarios,
      earned_badges: earnedBadges,
      total_sessions: totalSessions,
      unlocked_content: unlockedContent,
      last_active: new Date().toISOString(),
    };

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
    if (typeof pacingMode === "boolean") {
      profilePayload.pacing_mode = pacingMode;
    }

    const { error: progressError } = await supabaseAdmin.from("progress").upsert(progressPayload);
    if (progressError) throw progressError;

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(profilePayload);
    if (profileError) throw profileError;

    return res.json({ ok: true });
  } catch (error) {
    console.error("Progress update failed:", error);
    return res.status(500).json({ error: "Failed to update progress" });
  }
});

app.post("/api/sessions/save", async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const { userId, scenarioId, messages, feedback, mood } = req.body ?? {};
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
    return res.json({ ok: true, session: data });
  } catch (error) {
    console.error("Session save failed:", error);
    return res.status(500).json({ error: "Failed to save session" });
  }
});

app.post("/api/sessions/list", async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const { userId } = req.body ?? {};
    if (!userId) return res.status(400).json({ error: "userId is required" });
    const { data, error } = await supabaseAdmin
      .from("sessions")
      .select("id, scenario_id, messages, feedback, mood, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(80);
    if (error) throw error;
    return res.json({ sessions: data ?? [] });
  } catch (error) {
    console.error("Sessions list failed:", error);
    return res.status(500).json({ error: "Failed to list sessions" });
  }
});

app.post("/api/sessions/delete", async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const { userId, sessionId } = req.body ?? {};
    if (!userId || !sessionId) return res.status(400).json({ error: "userId and sessionId are required" });
    const { error } = await supabaseAdmin.from("sessions").delete().eq("id", sessionId).eq("user_id", userId);
    if (error) throw error;
    return res.json({ ok: true });
  } catch (error) {
    console.error("Session delete failed:", error);
    return res.status(500).json({ error: "Failed to delete session" });
  }
});

app.post("/api/scenarios/custom", async (req, res) => {
  try {
    const { description } = req.body ?? {};
    if (!description?.trim()) return res.status(400).json({ error: "description is required" });
    const system = [
      "You help NeuroChat generate bespoke conversation-practice scenarios for neurodivergent users.",
      "Return JSON only (no markdown). Keys:",
      '{"title","description","opener","partnerBrief","suggested_replies":[string,string,string],"icon"}',
      "icon must be one emoji. opener is the first line spoken by the other person.",
      "partnerBrief: instructions for the AI playing that role (tone, boundaries — never abusive or slurs).",
      "Keep everything plausible and safe.",
    ].join("\n");
    const raw = await claudeText(system, description.trim(), 900);
    if (!raw) return res.status(502).json({ error: "Empty AI response" });
    let parsed;
    try {
      parsed = JSON.parse(stripJsonFence(raw));
    } catch {
      return res.status(502).json({ error: "Invalid scenario JSON from model" });
    }
    const suggested = Array.isArray(parsed.suggested_replies)
      ? parsed.suggested_replies.map(String).slice(0, 3)
      : [];
    while (suggested.length < 3) suggested.push("I'll explain briefly what's going on for me.");
    return res.json({
      scenario: {
        title: String(parsed.title ?? "Custom scenario"),
        description: String(parsed.description ?? ""),
        opener: String(parsed.opener ?? "Hey — got a minute?"),
        partnerBrief: String(parsed.partnerBrief ?? ""),
        suggested_replies: suggested,
        icon: String(parsed.icon ?? "💬"),
      },
    });
  } catch (error) {
    console.error("Custom scenario failed:", error);
    return res.status(500).json({ error: "Failed to generate scenario" });
  }
});

app.post("/api/custom-scenarios/list", async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const { userId } = req.body ?? {};
    if (!userId) return res.status(400).json({ error: "userId is required" });
    const { data, error } = await supabaseAdmin
      .from("custom_scenarios")
      .select("id, title, description, opener, ai_personality, suggested_replies, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return res.json({ scenarios: data ?? [] });
  } catch (error) {
    console.error("Custom scenarios list failed:", error);
    return res.status(500).json({ error: "Failed to load custom scenarios" });
  }
});

app.post("/api/custom-scenarios/save", async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const { userId, title, description, opener, ai_personality, suggested_replies } = req.body ?? {};
    if (!userId || !title || !opener) return res.status(400).json({ error: "userId, title, opener required" });
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
    return res.json({ ok: true, id: data.id });
  } catch (error) {
    console.error("Custom scenario save failed:", error);
    return res.status(500).json({ error: "Failed to save custom scenario" });
  }
});

app.post("/api/prepare", async (req, res) => {
  try {
    const { eventDescription, eventDate, availableScenarioIds = [], availableScenarioSummaries = [] } = req.body ?? {};
    if (!eventDescription?.trim()) return res.status(400).json({ error: "eventDescription is required" });
    const catalogLines =
      Array.isArray(availableScenarioSummaries) && availableScenarioSummaries.length > 0
        ? availableScenarioSummaries.join("\n")
        : availableScenarioIds.map((id) => `- ${id}`).join("\n");
    const system = [
      "Pick up to 5 NeuroChat scenario IDs that best match the user's upcoming real event.",
      "Only choose IDs from the allowed list provided. Return JSON only:",
      '{"headline": string, "suggestedScenarioIds": string[], "tip": string}',
      "headline is a warm single sentence. tip is one supportive coaching sentence.",
    ].join("\n");
    const userPrompt = [
      `Upcoming event: ${eventDescription.trim()}`,
      eventDate ? `Date / timeframe: ${eventDate}` : "",
      "Allowed scenario ids with titles:",
      catalogLines,
    ].join("\n\n");
    const raw = await claudeText(system, userPrompt, 700);
    if (!raw) return res.status(502).json({ error: "Empty AI response" });
    let parsed;
    try {
      parsed = JSON.parse(stripJsonFence(raw));
    } catch {
      return res.status(502).json({ error: "Invalid prepare JSON" });
    }
    const allowed = new Set(availableScenarioIds);
    const filtered = (Array.isArray(parsed.suggestedScenarioIds) ? parsed.suggestedScenarioIds : [])
      .map(String)
      .filter((id) => allowed.has(id))
      .slice(0, 5);
    return res.json({
      headline: String(parsed.headline ?? "You've got this."),
      suggestedScenarioIds: filtered,
      tip: String(parsed.tip ?? ""),
    });
  } catch (error) {
    console.error("Prepare plan failed:", error);
    return res.status(500).json({ error: "Failed to build prepare plan" });
  }
});

app.post("/api/explain", async (req, res) => {
  try {
    const { aiLine, scenarioTitle, scenarioCategory } = req.body ?? {};
    if (!aiLine?.trim()) return res.status(400).json({ error: "aiLine is required" });
    const system = [
      "You explain social cues for NeuroChat users who may be neurodivergent.",
      "Respond with plain-language JSON only: {\"explanation\": string}",
      "Explain what the other person's message might signal socially — neutrally, without diagnosing emotions.",
      "No judgement of the user. 3–5 sentences max.",
    ].join("\n");
    const userPrompt = [
      `Scenario: ${scenarioTitle ?? "Practice"} (${scenarioCategory ?? "general"})`,
      `Their message: ${aiLine.trim()}`,
    ].join("\n");
    const raw = await claudeText(system, userPrompt, 500);
    if (!raw) return res.status(502).json({ error: "Empty explanation" });
    let parsed;
    try {
      parsed = JSON.parse(stripJsonFence(raw));
    } catch {
      return res.status(502).json({ error: "Invalid explanation JSON" });
    }
    return res.json({ explanation: String(parsed.explanation ?? "") });
  } catch (error) {
    console.error("Explain failed:", error);
    return res.status(500).json({ error: "Failed to explain" });
  }
});

app.get("/api/admin/org/:orgId", async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const { orgId } = req.params;
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

    const totals = {
      users: memberIds.length,
      totalSessions: progressRows.reduce((sum, p) => sum + (p.total_sessions || 0), 0),
      avgSessionsPerUser: memberIds.length
        ? Number(
            (
              progressRows.reduce((sum, p) => sum + (p.total_sessions || 0), 0) / memberIds.length
            ).toFixed(2),
          )
        : 0,
      activeLast7Days: active7d.size,
    };

    const topScenarios = Object.entries(scenarioCounts)
      .map(([scenarioId, count]) => ({ scenarioId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return res.json({
      organisation: org,
      totals,
      topScenarios,
      userStats,
    });
  } catch (error) {
    console.error("Admin dashboard failed:", error);
    return res.status(500).json({ error: "Failed to load admin dashboard" });
  }
});

app.listen(port, () => {
  console.log(`NeuroChat API listening on http://localhost:${port}`);
});
