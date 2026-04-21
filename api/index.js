const { ask, askStructured, askWithTools, tool, z } = require("../lib/llm");

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

async function handleBasicToolCall(body, interactionId) {
  const { question } = body;

  const getWeather = tool({
    description: "Get the current weather for a city",
    parameters: z.object({ city: z.string() }),
    execute: async ({ city }) => {
      const res = await fetch("https://devshowdown.com/api/weather", {
        method: "POST",
        headers: {
          "X-Interaction-Id": interactionId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ city }),
      });
      return res.json();
    },
  });

  const result = await askWithTools(question, { getWeather }, {
    system: "You answer weather questions. Use the getWeather tool to look up current weather, then respond with a natural language answer that includes the temperature.",
    interactionId,
  });

  if (result.text) {
    return { answer: result.text };
  }

  const toolResult = result.steps
    ?.flatMap((s) => s.toolResults || [])
    .find((r) => r.toolName === "getWeather");

  if (toolResult?.result) {
    const answer = await ask(
      `The user asked: "${question}"\nWeather data: ${JSON.stringify(toolResult.result)}\nRespond naturally, include the temperature.`,
      { interactionId },
    );
    return { answer };
  }

  return { answer: "Unable to fetch weather data." };
}

const handlers = {
  HELLO_WORLD: handleHelloWorld,
  BASIC_LLM: handleBasicLlm,
  JSON_MODE: handleJsonMode,
  BASIC_TOOL_CALL: handleBasicToolCall,
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
