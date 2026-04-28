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
      moodHistory = [],
      mood,
      hasOnboarded,
    } = req.body ?? {};

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const progressPayload = {
      user_id: userId,
      completed_scenarios: completedScenarios,
      earned_badges: earnedBadges,
      total_sessions: totalSessions,
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

app.listen(port, () => {
  console.log(`NeuroChat API listening on http://localhost:${port}`);
});
