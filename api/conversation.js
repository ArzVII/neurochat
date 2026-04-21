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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};
    const { scenario, messages } = body;

    if (!scenario || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "scenario and non-empty messages[] are required" });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Server missing ANTHROPIC_API_KEY" });
    }

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 400,
        system: buildSystemPrompt(scenario),
        messages: toClaudeMessages(messages),
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error("Anthropic API error:", errorText);
      return res.status(502).json({ error: "Anthropic API request failed" });
    }

    const claudeResponse = await anthropicResponse.json();

    const text = claudeResponse.content
      ?.filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n")
      .trim();

    if (!text) {
      return res.status(502).json({ error: "Claude returned an empty response" });
    }

    return res.status(200).json({ reply: text });
  } catch (error) {
    console.error("Conversation endpoint failed:", error);
    return res.status(500).json({ error: "Failed to generate conversation response" });
  }
}
