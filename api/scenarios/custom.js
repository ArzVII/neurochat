function stripJsonFence(raw) {
  return raw.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};
    const { description } = body;
    if (!description?.trim()) {
      return res.status(400).json({ error: "description is required" });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Server missing ANTHROPIC_API_KEY" });
    }

    const system = [
      "You help NeuroChat generate bespoke conversation-practice scenarios for neurodivergent users.",
      "Return JSON only (no markdown). Keys:",
      '{"title","description","opener","partnerBrief","suggested_replies":[string,string,string],"icon"}',
      "icon must be one emoji. opener is the first line spoken by the other person.",
      "partnerBrief: instructions for the AI playing that role (tone, boundaries — never abusive or slurs).",
      "Keep everything plausible and safe.",
    ].join("\n");

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 900,
        system,
        messages: [{ role: "user", content: description.trim() }],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error("Anthropic API error:", errorText);
      return res.status(502).json({ error: "Anthropic API request failed" });
    }

    const claudeJson = await anthropicResponse.json();
    const raw = claudeJson.content
      ?.filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n")
      .trim();

    if (!raw) {
      return res.status(502).json({ error: "Empty AI response" });
    }

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

    return res.status(200).json({
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
}
