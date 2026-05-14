import { initialWorkflowState, reducer, selectCanAnalyze, selectCanTranslate } from "./workflow";
import type { IntentCard, TranslationResult } from "../shared/domain";

const result: TranslationResult = {
  translatedMessage: "请先评估这个方案的风险，再决定是否继续。",
  mbtiExplanation: "ISTJ 通常更容易接受具体风险和下一步。",
  preservedIntents: ["提醒方案风险"],
  adjustedExpressions: ["降低指责感"],
  strategy: {
    informationOrder: "先事实后请求",
    tone: "清晰克制",
    evidenceStyle: "具体依据",
    relationshipSignal: "共同解决问题",
    misunderstandingRisk: "避免被理解为否定个人",
    adjustments: []
  }
};

const intentCard = (card: Partial<IntentCard> & Pick<IntentCard, "id">): IntentCard => ({
  type: "information",
  content: "我想提醒方案风险。",
  confidence: "high",
  markers: [],
  ...card
});

test("requires original message before intent analysis", () => {
  expect(selectCanAnalyze(initialWorkflowState)).toBe(false);
  const state = reducer(initialWorkflowState, {
    type: "setOriginalMessage",
    value: "你这个方案风险太高了，我们不能继续这样做。"
  });
  expect(selectCanAnalyze(state)).toBe(true);
});

test("requires a primary intent before translation", () => {
  const withCards = reducer(initialWorkflowState, {
    type: "setIntentCards",
    cards: [
      {
        id: "intent-1",
        type: "information",
        content: "我想提醒方案风险。",
        confidence: "high",
        markers: []
      }
    ],
    questions: []
  });

  expect(selectCanTranslate(withCards)).toBe(false);

  const withPrimary = reducer(withCards, {
    type: "toggleMarker",
    id: "intent-1",
    marker: "primary"
  });

  expect(selectCanTranslate(withPrimary)).toBe(true);
});

test("keeps only one primary intent", () => {
  const state = reducer(initialWorkflowState, {
    type: "setIntentCards",
    cards: [
      { id: "one", type: "information", content: "传递事实", confidence: "high", markers: ["primary"] },
      { id: "two", type: "action", content: "请求行动", confidence: "medium", markers: [] }
    ],
    questions: []
  });

  const next = reducer(state, { type: "toggleMarker", id: "two", marker: "primary" });

  expect(next.intentCards.find((card) => card.id === "one")?.markers).not.toContain("primary");
  expect(next.intentCards.find((card) => card.id === "two")?.markers).toContain("primary");
});

test("toggles off an existing primary intent", () => {
  const state = reducer(initialWorkflowState, {
    type: "setIntentCards",
    cards: [intentCard({ id: "intent-1", markers: ["primary"] })],
    questions: []
  });

  const next = reducer(state, { type: "toggleMarker", id: "intent-1", marker: "primary" });

  expect(next.intentCards[0]?.markers).not.toContain("primary");
  expect(selectCanTranslate(next)).toBe(false);
});

test("does not clear the primary intent when toggling primary for an unknown id", () => {
  const state = reducer(initialWorkflowState, {
    type: "setIntentCards",
    cards: [
      intentCard({ id: "intent-1", markers: ["primary"] }),
      intentCard({ id: "intent-2", type: "action", markers: ["sensitive"] })
    ],
    questions: []
  });

  const next = reducer(state, { type: "toggleMarker", id: "missing", marker: "primary" });

  expect(next.intentCards).toEqual(state.intentCards);
  expect(next.intentCards.find((card) => card.id === "intent-1")?.markers).toContain("primary");
});

test("toggles non-primary markers on and off", () => {
  const state = reducer(initialWorkflowState, {
    type: "setIntentCards",
    cards: [intentCard({ id: "intent-1" })],
    questions: []
  });

  const withSensitive = reducer(state, { type: "toggleMarker", id: "intent-1", marker: "sensitive" });
  const withoutSensitive = reducer(withSensitive, {
    type: "toggleMarker",
    id: "intent-1",
    marker: "sensitive"
  });

  expect(withSensitive.intentCards[0]?.markers).toContain("sensitive");
  expect(withoutSensitive.intentCards[0]?.markers).not.toContain("sensitive");
});

test("clears the translation result when intent content or strength approval changes", () => {
  const withCards = reducer(initialWorkflowState, {
    type: "setIntentCards",
    cards: [intentCard({ id: "intent-1", markers: ["primary"] })],
    questions: []
  });
  const withResult = reducer(withCards, { type: "setResult", result });

  expect(
    reducer(withResult, {
      type: "updateIntentContent",
      id: "intent-1",
      content: "我想先暂停这个方案。"
    }).result
  ).toBeNull();
  expect(reducer(withResult, { type: "setStrengthApproved", value: true }).result).toBeNull();
});

test("clones intent cards and markers when setting intent cards", () => {
  const cards = [intentCard({ id: "intent-1", markers: ["primary"] })];
  const state = reducer(initialWorkflowState, {
    type: "setIntentCards",
    cards,
    questions: []
  });

  cards[0]!.content = "外部变更";
  cards[0]!.markers.push("sensitive");

  expect(state.intentCards[0]?.content).toBe("我想提醒方案风险。");
  expect(state.intentCards[0]?.markers).toEqual(["primary"]);
});
