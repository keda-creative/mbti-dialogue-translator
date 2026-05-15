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
const REPLY_PATTERN = /不回|回复|消息|已读|联系/;
const ADVANCE_NOTICE_PATTERN = /提前|每次|临时|安排|通知|告诉/;
const BOUNDARY_PATTERN = /不行|不要|拒绝|边界|不能/;
const RISK_PATTERN = /风险|问题|隐患|不稳|失控/;

function buildInformationIntent(message: string): string {
  if (RISK_PATTERN.test(message)) {
    return "我想让对方知道，我对当前方案或决定里的风险有明确担心。";
  }

  if (REPLY_PATTERN.test(message)) {
    return "我想让对方知道，回应不及时会让我感到不被重视或缺少确定感。";
  }

  if (ADVANCE_NOTICE_PATTERN.test(message)) {
    return "我想让对方知道，临时变化或没有提前说明会影响我的安排。";
  }

  if (BOUNDARY_PATTERN.test(message)) {
    return "我想表达一个真实的拒绝、限制或边界。";
  }

  return `我想让对方理解这句话背后的关键信息：「${message.slice(0, 28)}」。`;
}

function buildActionIntent(request: AnalyzeIntentRequest): string {
  const message = request.originalMessage;

  if (REPLY_PATTERN.test(message)) {
    return "我希望对方回应我的感受，并一起确认更可预期的沟通节奏。";
  }

  if (ADVANCE_NOTICE_PATTERN.test(message)) {
    return "我希望以后有变化时，对方可以提前告诉我。";
  }

  if (RISK_PATTERN.test(message)) {
    return request.config.scenario === "work"
      ? "我希望我们先确认风险、责任边界和下一步安排。"
      : "我希望我们先把担心讲清楚，再一起决定怎么处理。";
  }

  if (BOUNDARY_PATTERN.test(message)) {
    return "我希望对方尊重这个边界，并和我确认可接受的下一步。";
  }

  return "我希望对方先理解我的重点，再回应或一起决定下一步。";
}

function buildRelationshipIntent(request: AnalyzeIntentRequest): string {
  switch (request.config.scenario) {
    case "romantic":
      return "我希望对方理解，我是在亲密关系里寻求连接和确定感，不是单纯指责。";
    case "friends_family":
      return "我希望家人或朋友理解，我在意的是被尊重和被提前告知。";
    case "work":
      return "我希望对方理解这是为了共同目标和协作质量，不是否定个人能力。";
    case "general":
      return "我希望对方理解我的真实立场，同时不要把这句话听成攻击。";
    default:
      return "我希望对方理解我的真实立场，同时不要把这句话听成攻击。";
  }
}

function buildEmotionIntent(request: AnalyzeIntentRequest): string {
  switch (request.config.scenario) {
    case "romantic":
      return "我有委屈、失落或不安，希望这份情绪被看见，但不变成互相拉扯。";
    case "friends_family":
      return "我有被打乱安排或没被尊重的感受，希望这份情绪能被理解。";
    case "work":
      return "我有担心和着急，希望这份情绪被理解但不要变成压力。";
    case "general":
      return "我有一部分情绪需要被理解，但不希望它盖过真正想说的事。";
    default:
      return "我有一部分情绪需要被理解，但不希望它盖过真正想说的事。";
  }
}

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
  const hasBackground = Boolean(parsed.conversationBackground?.trim());

  const intentCards: AnalyzeIntentResponse["intentCards"] = [
    {
      id: "intent-1",
      type: "information",
      content: hasBackground
        ? `${buildInformationIntent(parsed.originalMessage)} 这和当前对话背景有关。`
        : buildInformationIntent(parsed.originalMessage),
      confidence: "high",
      markers: ["primary"]
    },
    {
      id: "intent-2",
      type: "action",
      content: buildActionIntent(parsed),
      confidence: "medium",
      markers: []
    },
    {
      id: "intent-3",
      type: "relationship",
      content: buildRelationshipIntent(parsed),
      confidence: "medium",
      markers: ["sensitive"]
    }
  ];

  if (hasStrongSignal) {
    intentCards.push({
      id: "intent-4",
      type: "emotion",
      content: buildEmotionIntent(parsed),
      confidence: "medium",
      markers: ["softenable"]
    });
  }

  return analyzeIntentResponseSchema.parse({
    intentCards,
    clarifyingQuestions: [],
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
