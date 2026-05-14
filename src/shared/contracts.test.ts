import {
  analyzeIntentResponseSchema,
  translationResponseSchema
} from "./contracts";

test("validates an intent analysis response", () => {
  const parsed = analyzeIntentResponseSchema.parse({
    intentCards: [
      {
        id: "intent-1",
        type: "information",
        content: "我想提醒方案风险。",
        confidence: "high",
        markers: []
      }
    ],
    clarifyingQuestions: [],
    safetyRedirect: null
  });

  expect(parsed.intentCards[0].type).toBe("information");
});

test("validates a translation response", () => {
  const parsed = translationResponseSchema.parse({
    translatedMessage: "我担心这个方案当前的风险偏高，建议我们先复盘关键假设。",
    mbtiExplanation: "考虑到 B 是 ISTJ，可能更容易接收事实和步骤清晰的表达。",
    preservedIntents: ["提醒方案风险"],
    adjustedExpressions: ["降低了责备感"],
    strategy: {
      informationOrder: "先事实，再建议",
      tone: "克制直接",
      evidenceStyle: "事实和流程",
      relationshipSignal: "共同目标",
      misunderstandingRisk: "对方可能先听成否定能力",
      adjustments: []
    }
  });

  expect(parsed.adjustedExpressions).toContain("降低了责备感");
});
