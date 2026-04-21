const { generateText, generateObject, tool } = require("ai");
const { createOpenAICompatible } = require("@ai-sdk/openai-compatible");
const { z } = require("zod");

const DEFAULT_MODEL = "rosseta-4";

function createLlmProvider(interactionId) {
  return createOpenAICompatible({
    name: "dev-showdown",
    baseURL: "https://devshowdown.com/v1",
    headers: {
      Authorization: `Bearer ${process.env.DEV_SHOWDOWN_API_KEY || "dsk_1_LmKvekecP3HtKV10ZaIeGWmORkPMp0rNciSo9SS4Q"}`,
      "X-Interaction-Id": interactionId,
    },
    supportsStructuredOutputs: true,
  });
}

async function ask(prompt, { system, interactionId } = {}) {
  const provider = createLlmProvider(interactionId);
  const result = await generateText({
    model: provider.chatModel(DEFAULT_MODEL),
    system,
    prompt,
  });
  return result.text;
}

async function askStructured(prompt, schema, { system, interactionId } = {}) {
  const provider = createLlmProvider(interactionId);
  const result = await generateObject({
    model: provider.chatModel(DEFAULT_MODEL),
    system,
    prompt,
    schema,
  });
  return result.object;
}

async function askWithTools(prompt, tools, { system, interactionId, maxSteps = 5 } = {}) {
  const provider = createLlmProvider(interactionId);
  const result = await generateText({
    model: provider.chatModel(DEFAULT_MODEL),
    system,
    prompt,
    tools,
    maxSteps,
  });
  return { text: result.text, steps: result.steps, toolResults: result.toolResults };
}

module.exports = { createLlmProvider, ask, askStructured, askWithTools, tool, DEFAULT_MODEL, z };
