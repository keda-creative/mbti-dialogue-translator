import { initialWorkflowState, reducer, selectCanAnalyze, selectCanTranslate } from "./workflow";
import type { IntentCard, TranslationResult, TranslatorConfig } from "../shared/domain";
import type { WorkflowState } from "./workflow";

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

const nextConfig: TranslatorConfig = {
  senderType: "INTJ",
  receiverType: "ESFP",
  scenario: "romantic"
};

function analyzedState(): WorkflowState {
  return {
    ...initialWorkflowState,
    originalMessage: "你这个方案风险太高了。",
    intentCards: [intentCard({ id: "intent-1", markers: ["primary", "softenable"] })],
    clarifyingQuestions: [
      {
        id: "question-1",
        question: "对方是否已经知道背景？",
        reason: "影响信息顺序。"
      }
    ],
    clarificationAnswers: {
      "question-1": "知道一部分。"
    },
    strengthApproved: true,
    error: "需要安全改写。",
    result
  };
}

function expectAnalysisReset(state: WorkflowState) {
  expect(state.intentCards).toEqual([]);
  expect(state.clarifyingQuestions).toEqual([]);
  expect(state.clarificationAnswers).toEqual({});
  expect(state.strengthApproved).toBe(false);
  expect(state.result).toBeNull();
  expect(state.error).toBeNull();
}

test("requires original message before intent analysis", () => {
  expect(selectCanAnalyze(initialWorkflowState)).toBe(false);
  const state = reducer(initialWorkflowState, {
    type: "setOriginalMessage",
    value: "不行"
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

test("clears strength approval when the strength gate is no longer visible", () => {
  const state = {
    ...initialWorkflowState,
    intentCards: [intentCard({ id: "intent-1", markers: ["softenable"] })],
    strengthApproved: true
  };

  const withoutSoftenableMarker = reducer(state, {
    type: "toggleMarker",
    id: "intent-1",
    marker: "softenable"
  });
  const withoutSoftenableCard = reducer(state, {
    type: "deleteIntent",
    id: "intent-1"
  });

  expect(withoutSoftenableMarker.strengthApproved).toBe(false);
  expect(withoutSoftenableCard.strengthApproved).toBe(false);
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

test("resets analysis state when original message or config changes", () => {
  const afterMessageChange = reducer(analyzedState(), {
    type: "setOriginalMessage",
    value: "我想换一个表达。"
  });

  expect(afterMessageChange.originalMessage).toBe("我想换一个表达。");
  expectAnalysisReset(afterMessageChange);

  const afterConfigChange = reducer(analyzedState(), {
    type: "setConfig",
    config: nextConfig
  });

  expect(afterConfigChange.config).toEqual(nextConfig);
  expectAnalysisReset(afterConfigChange);
});
