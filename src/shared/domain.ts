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

export const SCENARIO_IDS = [
  "work",
  "romantic",
  "friends_family",
  "general"
] as const;

export type ScenarioId = (typeof SCENARIO_IDS)[number];

type ScenarioOption = Readonly<{
  id: ScenarioId;
  label: string;
}>;

const scenarioLabels: Record<ScenarioId, string> = {
  work: "工作协作",
  romantic: "亲密关系",
  friends_family: "朋友家人",
  general: "通用"
};

export const SCENARIOS: ReadonlyArray<ScenarioOption> = SCENARIO_IDS.map((id) => ({
  id,
  label: scenarioLabels[id]
}));

export const INTENT_TYPE_IDS = [
  "information",
  "action",
  "outcome",
  "relationship",
  "emotion",
  "reverse"
] as const;

export type IntentType = (typeof INTENT_TYPE_IDS)[number];

type IntentTypeOption = Readonly<{
  id: IntentType;
  label: string;
  helper: string;
}>;

const intentTypeContent: Record<IntentType, Omit<IntentTypeOption, "id">> = {
  information: {
    label: "信息意图",
    helper: "想让对方知道的事实、背景、判断或担心。"
  },
  action: {
    label: "行为意图",
    helper: "希望对方接下来做什么、停止做什么，或给出什么回应。"
  },
  outcome: {
    label: "结果意图",
    helper: "希望这次沟通最后达成的状态或决定。"
  },
  relationship: {
    label: "关系意图",
    helper: "希望对方如何理解你们之间的关系、边界或在乎。"
  },
  emotion: {
    label: "情绪意图",
    helper: "希望对方理解你的感受，不一定等于要求对方立刻行动。"
  },
  reverse: {
    label: "反向意图",
    helper: "最不希望对方误会成的意思。"
  }
};

export const INTENT_TYPES: ReadonlyArray<IntentTypeOption> = INTENT_TYPE_IDS.map((id) => ({
  id,
  ...intentTypeContent[id]
}));

export const INTENT_MARKERS = ["primary", "sensitive", "softenable"] as const;

export type IntentMarker = (typeof INTENT_MARKERS)[number];

export const INTENT_CONFIDENCE_LEVELS = ["low", "medium", "high"] as const;

export type IntentConfidenceLevel = (typeof INTENT_CONFIDENCE_LEVELS)[number];

export const EXPRESSION_SIGNALS = [
  "blame",
  "anxiety",
  "sarcasm",
  "control",
  "intensity"
] as const;

export type ExpressionSignal = (typeof EXPRESSION_SIGNALS)[number];

export interface IntentCard {
  id: string;
  type: IntentType;
  content: string;
  confidence: IntentConfidenceLevel;
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
  signal: ExpressionSignal;
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
