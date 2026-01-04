import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // Handle preflight
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

    // 1. Create a thread
    const thread = await openai.beta.threads.create();

    // 2. Add user message
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message,
    });

    // 3. Run assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: "asst_VeCWjZSuhN5zP9XipjhvQZP6", // unchanged
    });

    // 4. Wait for completion
    let runStatus;
    do {
      await new Promise((r) => setTimeout(r, 800));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    } while (runStatus.status !== "completed");

    // 5. Read messages
    const messages = await openai.beta.threads.messages.list(thread.id);

    const assistantMessage = messages.data.find(
      (m) => m.role === "assistant"
    );

    let rawText = "";

    if (assistantMessage?.content?.length) {
      for (const block of assistantMessage.content) {
        if (block.type === "text" && block.text?.value) {
          rawText += block.text.value + "\n";
        }
      }
    }

    // ---------- NORMALIZATION (THE REAL FIX) ----------

    let reply = rawText.trim();

    // Case 1: JSON-like wrapper → extract value
    if (reply.startsWith("{") && reply.includes("reply")) {
      try {
        const parsed = JSON.parse(reply);
        if (typeof parsed.reply === "string") {
          reply = parsed.reply;
        }
      } catch (_) {
        // ignore parse failure, fall through
      }
    }

    // Case 2: "reply :" prefix → remove only the key, not content
    reply = reply.replace(/^\s*reply\s*:\s*/i, "");

    // Final human cleanup (light, safe)
    reply = reply
      .replace(/\*+/g, "")              // remove markdown
      .replace(/^\s*[-•]\s+/gm, "")     // remove bullets
      .replace(/\n{3,}/g, "\n\n")       // normalize spacing
      .replace(/^"+|"+$/g, "")          // trim stray quotes
      .trim();

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Faiz AI error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
