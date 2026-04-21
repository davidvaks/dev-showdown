const { generateText } = require("ai");
const { createOpenAICompatible } = require("@ai-sdk/openai-compatible");

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

module.exports = { createLlmProvider, ask, DEFAULT_MODEL };
