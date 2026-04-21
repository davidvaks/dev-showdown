const { ask } = require("../lib/llm");

async function handleHelloWorld(body) {
  const { name } = body;
  return { greeting: `Hello ${name}` };
}

async function handleBasicLlm(body, interactionId) {
  const { question } = body;
  const answer = await ask(question, {
    system: "Answer the question correctly and concisely.",
    interactionId,
  });
  return { answer };
}

const handlers = {
  HELLO_WORLD: handleHelloWorld,
  BASIC_LLM: handleBasicLlm,
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const interactionId = req.headers["x-interaction-id"];
  const challengeType = req.query.challengeType;
  const handler = handlers[challengeType];

  if (!handler) {
    return res.status(400).json({ error: `Unknown challengeType: ${challengeType}` });
  }

  try {
    const result = await handler(req.body, interactionId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
