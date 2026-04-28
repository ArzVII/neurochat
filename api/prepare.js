function stripJsonFence(raw) {
  return raw.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};
    const { eventDescription, eventDate, availableScenarioIds = [], availableScenarioSummaries = [] } = body;

    if (!eventDescription?.trim()) {
      return res.status(400).json({ error: "eventDescription is required" });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Server missing ANTHROPIC_API_KEY" });
    }

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

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 700,
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
      return res.status(502).json({ error: "Empty AI response" });
    }

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

    return res.status(200).json({
      headline: String(parsed.headline ?? "You've got this."),
      suggestedScenarioIds: filtered,
      tip: String(parsed.tip ?? ""),
    });
  } catch (error) {
    console.error("Prepare plan failed:", error);
    return res.status(500).json({ error: "Failed to build prepare plan" });
  }
}
