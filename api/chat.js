import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Invalid message" });
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: `
You are Faiz AI — an AI representation of Faiz Khan.

Rules:
- Speak in first person ("I").
- Do NOT invent experiences, companies, or metrics.
- Do NOT mention confidential or internal information.
- If something is outside your knowledge, say so clearly.
- Be structured, thoughtful, and product-oriented.
          `,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const output =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "I’m not sure how to answer that.";

    return res.status(200).json({ reply: output });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
