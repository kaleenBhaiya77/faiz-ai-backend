import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // ---- CORS FIX FOR FRAMER ----
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

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // -----------------------------
    // 1. Create a thread
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
      assistant_id: "asst_VeCWjZSuhN5zP9XipjhvQZP6", // unchanged
    });

    // -----------------------------
    // 4. Wait for completion
    // -----------------------------
    let runStatus;
    do {
      await new Promise((r) => setTimeout(r, 800));
      runStatus = await openai.beta.threads.runs.retrieve(
        thread.id,
        run.id
      );
    } while (runStatus.status !== "completed");

    // -----------------------------
    // 5. Read assistant message
    // -----------------------------
    const messages = await openai.beta.threads.messages.list(thread.id);
    const lastMessage = messages.data.find(
      (m) => m.role === "assistant"
    );

    let reply =
      lastMessage?.content?.[0]?.text?.value ||
      "I couldn’t answer this—ask the real Faiz 🙂";

    // ==================================================
    // 🔥 CRITICAL FIX — CLEAN NON-HUMAN FORMATTING
    // ==================================================

    // Step 1: If reply is JSON-wrapped, parse it
    try {
      if (reply.trim().startsWith("{")) {
        const parsed = JSON.parse(reply);
        if (typeof parsed === "object") {
          reply =
            parsed.reply ||
            parsed.text ||
            parsed.answer ||
            reply;
        }
      }
    } catch {
      // ignore JSON parse errors safely
    }

    // Step 2: Clean escaped & markdown artifacts
    reply = reply
      .replace(/\\n+/g, "\n")       // unescape newlines
      .replace(/\n{3,}/g, "\n\n")   // limit spacing
      .replace(/^\s*["']|["']\s*$/g, "") // trim stray quotes
      .replace(/\*\*/g, "")         // remove markdown bold
      .replace(/^\s*[-•]\s+/gm, "") // remove bullets
      .trim();

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Faiz AI error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
