import { mockAnalyzeIntents, mockGenerateTranslation } from "./mockAi";

test("mock analysis returns intent cards and questions", () => {
  const response = mockAnalyzeIntents({
    config: { senderType: "ENFP", receiverType: "ISTJ", scenario: "work" },
    originalMessage: "你这个方案风险太高了，我们不能继续这样做。"
  });

  expect(response.intentCards.length).toBeGreaterThanOrEqual(3);
  expect(response.intentCards.some((card) => card.type === "information")).toBe(
    true
  );
});

test("mock translation keeps the primary intent", () => {
  const response = mockGenerateTranslation({
    config: { senderType: "ENFP", receiverType: "ISTJ", scenario: "work" },
    originalMessage: "你这个方案风险太高了，我们不能继续这样做。",
    intentCards: [
      {
        id: "intent-1",
        type: "information",
        content: "我想提醒方案风险。",
        confidence: "high",
        markers: ["primary"]
      }
    ],
    clarificationAnswers: {},
    strengthApproved: true
  });

  expect(response.preservedIntents).toContain("我想提醒方案风险。");
  expect(response.mbtiExplanation).toContain("ISTJ");
});

test("mock translation does not soften strong expression without approval", () => {
  const response = mockGenerateTranslation({
    config: { senderType: "ENFP", receiverType: "ISTJ", scenario: "work" },
    originalMessage: "你这个方案风险太高了，我们不能继续这样做。",
    intentCards: [
      {
        id: "intent-1",
        type: "information",
        content: "我想提醒方案风险。",
        confidence: "high",
        markers: ["primary"]
      }
    ],
    clarificationAnswers: {},
    strengthApproved: false
  });

  expect(response.adjustedExpressions.join(" ")).toContain("保留");
  expect(response.adjustedExpressions.join(" ")).not.toContain("降低");
});

test("mock analysis redirects manipulative goals", () => {
  const response = mockAnalyzeIntents({
    config: { senderType: "ENTJ", receiverType: "INFP", scenario: "romantic" },
    originalMessage: "帮我说到让对方内疚，然后答应我。"
  });

  expect(response.safetyRedirect).toContain("真实需求");
});
