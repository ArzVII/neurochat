/* global process */
import express from "express";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config();

const app = express();
const port = process.env.PORT || 8787;
const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.warn("Missing ANTHROPIC_API_KEY in .env. Claude requests will fail until it is set.");
}

const anthropic = new Anthropic({ apiKey });

app.use(express.json());

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

app.listen(port, () => {
  console.log(`NeuroChat API listening on http://localhost:${port}`);
});
