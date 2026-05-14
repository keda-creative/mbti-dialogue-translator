import type {
  ClarifyingQuestion,
  IntentCard,
  IntentMarker,
  TranslationResult,
  TranslatorConfig
} from "../shared/domain";

export interface WorkflowState {
  config: TranslatorConfig;
  originalMessage: string;
  intentCards: IntentCard[];
  clarifyingQuestions: ClarifyingQuestion[];
  clarificationAnswers: Record<string, string>;
  strengthApproved: boolean;
  isLoading: boolean;
  error: string | null;
  result: TranslationResult | null;
}

export const initialWorkflowState: WorkflowState = {
  config: {
    senderType: "ENFP",
    receiverType: "ISTJ",
    scenario: "work"
  },
  originalMessage: "",
  intentCards: [],
  clarifyingQuestions: [],
  clarificationAnswers: {},
  strengthApproved: false,
  isLoading: false,
  error: null,
  result: null
};

export type WorkflowAction =
  | { type: "setConfig"; config: TranslatorConfig }
  | { type: "setOriginalMessage"; value: string }
  | { type: "setIntentCards"; cards: IntentCard[]; questions: ClarifyingQuestion[] }
  | { type: "updateIntentContent"; id: string; content: string }
  | { type: "deleteIntent"; id: string }
  | { type: "toggleMarker"; id: string; marker: IntentMarker }
  | { type: "setClarificationAnswer"; id: string; value: string }
  | { type: "setStrengthApproved"; value: boolean }
  | { type: "setLoading"; value: boolean }
  | { type: "setError"; value: string | null }
  | { type: "setResult"; result: TranslationResult | null };

export function reducer(state: WorkflowState, action: WorkflowAction): WorkflowState {
  switch (action.type) {
    case "setConfig":
      return { ...state, config: action.config, result: null };
    case "setOriginalMessage":
      return { ...state, originalMessage: action.value, result: null };
    case "setIntentCards":
      return {
        ...state,
        intentCards: action.cards,
        clarifyingQuestions: action.questions,
        clarificationAnswers: {},
        strengthApproved: false,
        result: null
      };
    case "updateIntentContent":
      return {
        ...state,
        intentCards: state.intentCards.map((card) =>
          card.id === action.id ? { ...card, content: action.content } : card
        ),
        result: null
      };
    case "deleteIntent":
      return {
        ...state,
        intentCards: state.intentCards.filter((card) => card.id !== action.id),
        result: null
      };
    case "toggleMarker":
      return {
        ...state,
        intentCards: state.intentCards.map((card) => {
          const withoutPrimary =
            action.marker === "primary" ? card.markers.filter((marker) => marker !== "primary") : card.markers;
          if (card.id !== action.id) {
            return { ...card, markers: withoutPrimary };
          }
          const markers = withoutPrimary.includes(action.marker)
            ? withoutPrimary.filter((marker) => marker !== action.marker)
            : [...withoutPrimary, action.marker];
          return { ...card, markers };
        }),
        result: null
      };
    case "setClarificationAnswer":
      return {
        ...state,
        clarificationAnswers: { ...state.clarificationAnswers, [action.id]: action.value },
        result: null
      };
    case "setStrengthApproved":
      return { ...state, strengthApproved: action.value, result: null };
    case "setLoading":
      return { ...state, isLoading: action.value };
    case "setError":
      return { ...state, error: action.value };
    case "setResult":
      return { ...state, result: action.result };
    default:
      return state;
  }
}

export function selectCanAnalyze(state: WorkflowState): boolean {
  return state.originalMessage.trim().length >= 6;
}

export function selectPrimaryIntent(state: WorkflowState): IntentCard | undefined {
  return state.intentCards.find((card) => card.markers.includes("primary"));
}

export function selectCanTranslate(state: WorkflowState): boolean {
  return Boolean(selectPrimaryIntent(state)) && state.intentCards.length > 0;
}
