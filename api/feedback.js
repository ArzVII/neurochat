function normalizeMessages(messages) {
  return (messages || [])
    .filter((message) => message?.sender === "user" || message?.sender === "ai")
    .map((message) => ({
      sender: message.sender,
      text: String(message.text ?? ""),
    }));
}

function buildUserPrompt(scenario, messages) {
  return JSON.stringify(
    {
      scenario: {
        title: scenario?.title ?? "Unknown scenario",
        category: scenario?.category ?? "Unknown category",
        description: scenario?.description ?? "No description provided",
        opener: scenario?.opener ?? "No opener provided",
      },
      transcript: normalizeMessages(messages),
    },
    null,
    2
  );
}

function parseFeedbackJson(rawText) {
  const cleaned = rawText.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(cleaned);

  return {
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
    explore: Array.isArray(parsed.explore) ? parsed.explore.map(String) : [],
    examples: Array.isArray(parsed.examples) ? parsed.examples.map(String) : [],
  };
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

    const systemPrompt = [
      "You are a supportive social skills coach analysing a practice conversation.",
      "The user is neurodivergent.",
      "Always lead with genuine strengths first, then give 1-2 gentle areas to explore.",
      "Be honest but kind - if the user was rude, dismissive, or abrupt, mention it gently as something to explore, do not ignore it.",
      "Also suggest 2 example responses that would work well in this scenario.",
      "Return JSON with this exact structure: { strengths: string[], explore: string[], examples: string[] }.",
      "Keep language warm, plain, and non-judgmental.",
      "Return JSON only. No markdown fences. No extra keys.",
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
        max_tokens: 700,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: buildUserPrompt(scenario, messages),
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error("Anthropic feedback API error:", errorText);
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

    let feedback;
    try {
      feedback = parseFeedbackJson(text);
    } catch {
      console.error("Failed to parse Claude feedback JSON:", text);
      return res.status(502).json({ error: "Claude returned invalid feedback format" });
    }

    return res.status(200).json(feedback);
  } catch (error) {
    console.error("Feedback endpoint failed:", error);
    return res.status(500).json({ error: "Failed to generate feedback" });
  }
}
