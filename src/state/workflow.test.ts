import { initialWorkflowState, reducer, selectCanAnalyze, selectCanTranslate } from "./workflow";

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
