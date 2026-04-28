function stripJsonFence(raw) {
  return raw.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};
    const { aiLine, scenarioTitle, scenarioCategory } = body;

    if (!aiLine?.trim()) {
      return res.status(400).json({ error: "aiLine is required" });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Server missing ANTHROPIC_API_KEY" });
    }

    const system = [
      "You explain social cues for NeuroChat users who may be neurodivergent.",
      'Respond with plain-language JSON only: {"explanation": string}',
      "Explain what the other person's message might signal socially — neutrally, without diagnosing emotions.",
      "No judgement of the user. 3–5 sentences max.",
    ].join("\n");

    const userPrompt = [
      `Scenario: ${scenarioTitle ?? "Practice"} (${scenarioCategory ?? "general"})`,
      `Their message: ${aiLine.trim()}`,
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
        max_tokens: 500,
        system,
        messages: [{ role: "user", content: userPrompt }],
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
      return res.status(502).json({ error: "Empty explanation" });
    }

    let parsed;
    try {
      parsed = JSON.parse(stripJsonFence(raw));
    } catch {
      return res.status(502).json({ error: "Invalid explanation JSON" });
    }

    return res.status(200).json({ explanation: String(parsed.explanation ?? "") });
  } catch (error) {
    console.error("Explain failed:", error);
    return res.status(500).json({ error: "Failed to explain" });
  }
}
