const Anthropic = require("@anthropic-ai/sdk");
const { SYSTEM_PROMPT } = require("../models/systemPrompt");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const query = async (req, res) => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages,
    });

    const text = response.content?.[0]?.text || "";
    res.json({ text });
  } catch (error) {
    console.error("Anthropic API error:", error);
    res.status(500).json({ error: "Failed to contact AI service" });
  }
};

module.exports = { query };
