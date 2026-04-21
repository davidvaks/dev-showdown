const { ask, askStructured, z } = require("../lib/llm");

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

const productSchema = z.object({
  name: z.string(),
  price: z.number(),
  currency: z.string(),
  inStock: z.boolean(),
  dimensions: z.object({
    length: z.number(),
    width: z.number(),
    height: z.number(),
    unit: z.string(),
  }),
  manufacturer: z.object({
    name: z.string(),
    country: z.string(),
    website: z.string(),
  }),
  specifications: z.object({
    weight: z.number(),
    weightUnit: z.string(),
    warrantyMonths: z.number().int(),
  }),
});

async function handleJsonMode(body, interactionId) {
  const { description } = body;
  return askStructured(description, productSchema, {
    system: "Extract structured product information from the description. Return all fields exactly as described in the text.",
    interactionId,
  });
}

const handlers = {
  HELLO_WORLD: handleHelloWorld,
  BASIC_LLM: handleBasicLlm,
  JSON_MODE: handleJsonMode,
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
