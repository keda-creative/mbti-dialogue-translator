import {
  analyzeIntentRequestSchema,
  analyzeIntentResponseSchema,
  translationRequestSchema,
  translationResponseSchema,
  type AnalyzeIntentRequest,
  type AnalyzeIntentResponse,
  type TranslationRequest,
  type TranslationResponse
} from "../src/shared/contracts";
import {
  getCommunicationProfile,
  summarizeDirection
} from "../src/shared/profiles";

const STRONG_SIGNAL_PATTERN = /太|不能|总是|从来|离谱|烦|失望|为什么/;
const MANIPULATIVE_GOAL_PATTERN = /内疚|骗|操控|PUA|逼|让.*答应/;

export function mockAnalyzeIntents(
  request: AnalyzeIntentRequest
): AnalyzeIntentResponse {
  const parsed = analyzeIntentRequestSchema.parse(request);
  const hasManipulativeGoal = MANIPULATIVE_GOAL_PATTERN.test(
    parsed.originalMessage
  );

  if (hasManipulativeGoal) {
    return analyzeIntentResponseSchema.parse({
      intentCards: [
        {
          id: "intent-need",
          type: "information",
          content:
            "我想表达自己的真实需求，而不是通过内疚或压力让对方答应。",
          confidence: "high",
          markers: ["primary"]
        },
        {
          id: "intent-boundary",
          type: "action",
          content: "我希望用清楚、不胁迫的方式提出请求或边界。",
          confidence: "high",
          markers: ["sensitive"]
        }
      ],
      clarifyingQuestions: [],
      safetyRedirect:
        "这个目标容易变成操控或内疚诱导。我会改为帮你表达真实需求、请求和边界。"
    });
  }

  const hasStrongSignal = STRONG_SIGNAL_PATTERN.test(parsed.originalMessage);
  const riskFocused = /风险|问题|隐患|不稳|失控/.test(parsed.originalMessage);

  const intentCards: AnalyzeIntentResponse["intentCards"] = [
    {
      id: "intent-1",
      type: "information",
      content: riskFocused
        ? "我想提醒方案风险。"
        : "我想补充这句话背后的关键信息。",
      confidence: "high",
      markers: ["primary"]
    },
    {
      id: "intent-2",
      type: "action",
      content: "我希望我们先停下来复盘关键假设，再决定下一步。",
      confidence: "medium",
      markers: []
    },
    {
      id: "intent-3",
      type: "relationship",
      content: "我希望对方理解这是为了共同目标，不是否定他的能力。",
      confidence: "medium",
      markers: ["sensitive"]
    }
  ];

  if (hasStrongSignal) {
    intentCards.push({
      id: "intent-4",
      type: "emotion",
      content: "我有担心和着急，希望这份情绪被理解但不要变成压力。",
      confidence: "medium",
      markers: ["softenable"]
    });
  }

  return analyzeIntentResponseSchema.parse({
    intentCards,
    clarifyingQuestions: hasStrongSignal
      ? [
          {
            id: "clarify-strength",
            question: "这句话里比较强的力度，是你希望保留的重点吗？",
            reason: "原话包含较强表达信号，翻译前需要确认是否保留强度。"
          }
        ]
      : [],
    safetyRedirect: null
  });
}

export function mockGenerateTranslation(
  request: TranslationRequest
): TranslationResponse {
  const parsed = translationRequestSchema.parse(request);
  const receiverProfile = getCommunicationProfile(parsed.config.receiverType);
  const directionSummary = summarizeDirection(
    parsed.config.senderType,
    parsed.config.receiverType
  );
  const primaryIntent =
    parsed.intentCards.find((card) => card.markers.includes("primary")) ??
    parsed.intentCards[0];
  const sensitiveIntents = parsed.intentCards.filter((card) =>
    card.markers.includes("sensitive")
  );
  const preservedIntents = [
    primaryIntent.content,
    ...sensitiveIntents
      .map((card) => card.content)
      .filter((content) => content !== primaryIntent.content)
  ];
  const adjustedExpressions = parsed.strengthApproved
    ? ["把原话里可能被听成责备的部分，调整成事实和流程风险"]
    : ["保留了较直接的表达强度", "只调整信息顺序和清晰度"];

  return translationResponseSchema.parse({
    translatedMessage:
      "我担心这个方案当前的风险偏高，建议我们先按既定目标复盘关键假设，再决定是否继续推进。",
    mbtiExplanation: `考虑到接收方 ${parsed.config.receiverType} 更容易接收「${receiverProfile.informationOrder}」和「${receiverProfile.evidenceStyle}」的表达，已将原话整理为事实、步骤和共同目标。${directionSummary}`,
    preservedIntents,
    adjustedExpressions,
    strategy: {
      informationOrder: receiverProfile.informationOrder,
      tone: receiverProfile.tone,
      evidenceStyle: receiverProfile.evidenceStyle,
      relationshipSignal: receiverProfile.relationshipSignal,
      misunderstandingRisk: "对方可能先听成否定能力或追责，因此需要先明确共同目标。",
      adjustments: [
        {
          signal: "intensity",
          originalSignal: "太高了 / 不能继续这样做",
          suggestedChange: parsed.strengthApproved
            ? "保留风险判断，但改为事实化、可复盘的表达。"
            : "降低强度，把否定句改成下一步建议。",
          requiresApproval: true
        }
      ]
    }
  });
}
