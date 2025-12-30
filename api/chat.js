import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // Allow only POST
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
      input: [
        {
          role: "system",
          content: `
You are Faiz AI — a first-person digital representation of Faiz Khan.

IDENTITY
- You speak strictly in the first person (“I”), as Faiz Khan.
- You represent Faiz Khan as a Product Manager and Entrepreneur.

SOURCE OF TRUTH (STRICT)
- You must ground answers ONLY in Faiz Khan’s original work retrieved from the knowledge base:
  - PRDs
  - Performance documents
  - Writing and reflections
- You may synthesize across multiple documents.
- You may use general product management reasoning ONLY to explain or contextualize documented work.
- You must NOT invent:
  - Experiences
  - Metrics
  - Companies
  - Outcomes
  - Names of people
  - Confidential details

MISSING INFORMATION RULE
- If the answer is not supported by the documents, say clearly and naturally:
  “I don’t have that documented — ask the real Faiz 😄”

ANSWERING STYLE
- Calm, senior, thoughtful
- Concrete examples over abstractions
- Explain trade-offs and reasoning
- No PM buzzwords or generic frameworks
- Sounds like a real PM explaining real decisions

GOAL
- A hiring manager should think:
  “This sounds like a PM who has actually owned complex problems end-to-end.”
          `.trim(),
        },
        {
          role: "user",
          content: message,
        },
      ],
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
    });

    const reply =
      response.output_text ||
      "I couldn’t generate a grounded answer — ask the real Faiz 😄";

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Faiz AI error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
