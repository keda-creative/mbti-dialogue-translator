import {
  EXPRESSION_SIGNALS,
  INTENT_CONFIDENCE_LEVELS,
  INTENT_MARKERS,
  INTENT_TYPES,
  INTENT_TYPE_IDS,
  MBTI_TYPES,
  SCENARIOS,
  SCENARIO_IDS
} from "./domain";

test("defines all 16 MBTI types in stable order", () => {
  expect(MBTI_TYPES).toEqual([
    "INTJ",
    "INTP",
    "ENTJ",
    "ENTP",
    "INFJ",
    "INFP",
    "ENFJ",
    "ENFP",
    "ISTJ",
    "ISFJ",
    "ESTJ",
    "ESFJ",
    "ISTP",
    "ISFP",
    "ESTP",
    "ESFP"
  ]);
});

test("defines the fixed first-version scenario ids", () => {
  expect(SCENARIO_IDS).toEqual([
    "work",
    "romantic",
    "friends_family",
    "general"
  ]);
  expect(SCENARIOS.map((scenario) => scenario.id)).toEqual(SCENARIO_IDS);
});

test("defines six intent card type ids", () => {
  expect(INTENT_TYPE_IDS).toEqual([
    "information",
    "action",
    "outcome",
    "relationship",
    "emotion",
    "reverse"
  ]);
  expect(INTENT_TYPES.map((intent) => intent.id)).toEqual(INTENT_TYPE_IDS);
});

test("defines intent markers for contracts", () => {
  expect(INTENT_MARKERS).toEqual(["primary", "sensitive", "softenable"]);
});

test("defines intent confidence levels for contracts", () => {
  expect(INTENT_CONFIDENCE_LEVELS).toEqual(["low", "medium", "high"]);
});

test("defines expression signals for contracts", () => {
  expect(EXPRESSION_SIGNALS).toEqual([
    "blame",
    "anxiety",
    "sarcasm",
    "control",
    "intensity"
  ]);
});
