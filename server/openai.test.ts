import { shouldUseMockAi } from "./openai";

test("uses mock AI when no API key is configured", () => {
  expect(shouldUseMockAi({ OPENAI_API_KEY: undefined })).toBe(true);
});

test("uses OpenAI when an API key is configured", () => {
  expect(shouldUseMockAi({ OPENAI_API_KEY: "sk-test" })).toBe(false);
});
