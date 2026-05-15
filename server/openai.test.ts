import { shouldUseMockAi } from "./openai";

test("uses mock AI when no API key is configured", () => {
  expect(
    shouldUseMockAi({
      AI_PROVIDER: undefined,
      OPENAI_API_KEY: undefined,
      DEEPSEEK_API_KEY: undefined
    })
  ).toBe(true);
});

test("uses OpenAI when an API key is configured", () => {
  expect(
    shouldUseMockAi({
      AI_PROVIDER: "openai",
      OPENAI_API_KEY: "sk-test",
      DEEPSEEK_API_KEY: undefined
    })
  ).toBe(false);
});

test("uses DeepSeek when selected and a DeepSeek key is configured", () => {
  expect(
    shouldUseMockAi({
      AI_PROVIDER: "deepseek",
      OPENAI_API_KEY: undefined,
      DEEPSEEK_API_KEY: "sk-test"
    })
  ).toBe(false);
});
