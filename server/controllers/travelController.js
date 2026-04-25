const { GoogleGenerativeAI } = require("@google/generative-ai");
const { SYSTEM_PROMPT } = require("../models/systemPrompt");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const query = async (req, res) => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemma-4-27b-it",
      systemInstruction: SYSTEM_PROMPT,
    });

    // Google AI uses "model" instead of "assistant" and requires parts arrays.
    // The last message is sent via sendMessage(); the rest form the history.
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1].content;

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage);
    const text = result.response.text();

    res.json({ text });
  } catch (error) {
    console.error("Google AI error:", error);
    res.status(500).json({ error: "Failed to contact AI service" });
  }
};

module.exports = { query };
