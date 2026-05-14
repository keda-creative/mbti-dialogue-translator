import { INTENT_TYPES, MBTI_TYPES, SCENARIOS } from "./domain";

test("defines all 16 MBTI types", () => {
  expect(MBTI_TYPES).toHaveLength(16);
  expect(MBTI_TYPES).toContain("INTJ");
  expect(MBTI_TYPES).toContain("ENFP");
});

test("defines the fixed first-version scenarios", () => {
  expect(SCENARIOS.map((scenario) => scenario.id)).toEqual([
    "work",
    "romantic",
    "friends_family",
    "general"
  ]);
});

test("defines six intent card types", () => {
  expect(INTENT_TYPES.map((intent) => intent.id)).toEqual([
    "information",
    "action",
    "outcome",
    "relationship",
    "emotion",
    "reverse"
  ]);
});
