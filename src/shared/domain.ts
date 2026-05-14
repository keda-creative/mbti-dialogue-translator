export const MBTI_TYPES = [
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
] as const;

export type MbtiType = (typeof MBTI_TYPES)[number];

export const SCENARIOS = [
  { id: "work", label: "工作协作" },
  { id: "romantic", label: "亲密关系" },
  { id: "friends_family", label: "朋友家人" },
  { id: "general", label: "通用" }
] as const;

export type ScenarioId = (typeof SCENARIOS)[number]["id"];

export const INTENT_TYPES = [
  { id: "information", label: "信息意图", helper: "我想让对方知道什么事实、背景或判断。" },
  { id: "action", label: "行动意图", helper: "我希望对方接下来做什么或停止做什么。" },
  { id: "outcome", label: "结果意图", helper: "我希望沟通之后达成什么状态。" },
  { id: "relationship", label: "关系意图", helper: "我希望对方如何理解我和 TA 的关系。" },
  { id: "emotion", label: "情绪意图", helper: "我希望自己的情绪被怎样理解。" },
  { id: "reverse", label: "反向意图", helper: "我最不希望对方误会成什么。" }
] as const;

export type IntentType = (typeof INTENT_TYPES)[number]["id"];

export type IntentMarker = "primary" | "sensitive" | "softenable";

export interface IntentCard {
  id: string;
  type: IntentType;
  content: string;
  confidence: "low" | "medium" | "high";
  markers: IntentMarker[];
}

export interface TranslatorConfig {
  senderType: MbtiType;
  receiverType: MbtiType;
  scenario: ScenarioId;
}

export interface ClarifyingQuestion {
  id: string;
  question: string;
  reason: string;
}

export interface ExpressionAdjustment {
  signal: "blame" | "anxiety" | "sarcasm" | "control" | "intensity";
  originalSignal: string;
  suggestedChange: string;
  requiresApproval: boolean;
}

export interface TranslationStrategy {
  informationOrder: string;
  tone: string;
  evidenceStyle: string;
  relationshipSignal: string;
  misunderstandingRisk: string;
  adjustments: ExpressionAdjustment[];
}

export interface TranslationResult {
  translatedMessage: string;
  mbtiExplanation: string;
  preservedIntents: string[];
  adjustedExpressions: string[];
  strategy: TranslationStrategy;
}
