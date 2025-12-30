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

    // 1. Create a thread
    const thread = await openai.beta.threads.create();

    // 2. Add user message
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message,
    });

    // 3. Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: "asst_Xk9KQZnIirLA05841QGXmnp9",
    });

    // 4. Wait for completion
    let runStatus;
    do {
      await new Promise((r) => setTimeout(r, 800));
      runStatus = await openai.beta.threads.runs.retrieve(
        thread.id,
        run.id
      );
    } while (runStatus.status !== "completed");

    // 5. Read response
    const messages = await openai.beta.threads.messages.list(thread.id);
    const lastMessage = messages.data.find(
      (m) => m.role === "assistant"
    );

    const reply =
      lastMessage?.content?.[0]?.text?.value ||
      "I couldn’t answer this—ask the real Faiz 🙂";

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Faiz AI error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
