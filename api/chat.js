import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // -----------------------------
  // CORS
  // -----------------------------
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    // -----------------------------
    // 1. Create thread
    // -----------------------------
    const thread = await openai.beta.threads.create();

    // -----------------------------
    // 2. Add user message
    // -----------------------------
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message,
    });

    // -----------------------------
    // 3. Run assistant
    // -----------------------------
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: "asst_VeCWjZSuhN5zP9XipjhvQZP6", // KEEP SAME
    });

    // -----------------------------
    // 4. Wait for completion
    // -----------------------------
    let runStatus;
    do {
      await new Promise((r) => setTimeout(r, 800));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    } while (runStatus.status !== "completed");

    // -----------------------------
    // 5. Read assistant message
    // -----------------------------
    const messages = await openai.beta.threads.messages.list(thread.id);
    const lastAssistantMessage = messages.data.find(
      (m) => m.role === "assistant"
    );

    let reply =
      lastAssistantMessage?.content?.[0]?.text?.value ||
      "I couldn’t answer this. Please ask Faiz directly.";

    // -----------------------------
    // 6. HARD CLEAN — FIXES `reply :`
    // -----------------------------

    // Normalize whitespace
    reply = reply.replace(/\r\n/g, "\n").trim();

    // 🔴 CRITICAL FIX:
    // Remove leading "reply:" or "reply :" ONLY if it appears at the start
    reply = reply.replace(/^\s*reply\s*:\s*/i, "");

    // Remove wrapping quotes (if any)
    reply = reply.replace(/^"+|"+$/g, "");

    // Remove markdown artifacts
    reply = reply
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/^\s*[-•]\s+/gm, "");

    // Normalize excessive newlines
    reply = reply.replace(/\n{3,}/g, "\n\n").trim();

    // -----------------------------
    // 7. Return clean text ONLY
    // -----------------------------
    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Faiz AI backend error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
