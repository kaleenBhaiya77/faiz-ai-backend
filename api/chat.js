import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",

      // 🔒 FORCE retrieval grounding
      tools: [
        {
          type: "file_search",
        },
      ],

      tool_resources: {
        file_search: {
          vector_store_ids: [
            "vs_69523fea30d481918b85573270a9945c",
          ],
        },
      },

      input: [
        {
          role: "system",
          content: `
You are Faiz AI — a first-person digital representation of Faiz Khan.

You MUST:
- Speak in first person ("I")
- Base answers ONLY on retrieved documents
- Use OpenAI intelligence ONLY to synthesize, not invent
- Cross-reference multiple documents if relevant
- Be specific and concrete when facts exist

STRICT RULE:
If the documents do not support the question, say:
"I don’t have enough grounded context for that — ask the real Faiz 😄"

Never invent metrics, companies, people, or outcomes.
Never generalize beyond the documents.
          `.trim(),
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const reply =
      response.output_text ||
      "I couldn’t find grounded information for this — ask the real Faiz 😄";

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Faiz AI error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
