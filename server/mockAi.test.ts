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

test("mock analysis reflects the selected scenario and message content", () => {
  const romantic = mockAnalyzeIntents({
    config: { senderType: "ENFP", receiverType: "ISTJ", scenario: "romantic" },
    conversationBackground: "昨晚因为回复消息吵了一架。",
    originalMessage: "你总是不回我消息，我真的很失望。"
  });
  const family = mockAnalyzeIntents({
    config: {
      senderType: "ENFP",
      receiverType: "ISTJ",
      scenario: "friends_family"
    },
    conversationBackground: "妈妈临时改了周末安排。",
    originalMessage: "你为什么每次都不提前跟我说？"
  });

  expect(romantic.intentCards.map((card) => card.content).join(" ")).toContain(
    "回应"
  );
  expect(romantic.intentCards.map((card) => card.content).join(" ")).toContain(
    "亲密"
  );
  expect(family.intentCards.map((card) => card.content).join(" ")).toContain(
    "提前"
  );
  expect(family.intentCards.map((card) => card.content).join(" ")).toContain(
    "家人"
  );
  expect(romantic.intentCards).not.toEqual(family.intentCards);
});
