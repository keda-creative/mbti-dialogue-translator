import type {
  IntentCard,
  TranslationResult,
  TranslatorConfig
} from "../shared/domain";

export interface WorkflowState {
  config: TranslatorConfig;
  originalMessage: string;
  conversationBackground: string;
  intentCards: IntentCard[];
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
  conversationBackground: "",
  intentCards: [],
  strengthApproved: false,
  isLoading: false,
  error: null,
  result: null
};

export type WorkflowAction =
  | { type: "setConfig"; config: TranslatorConfig }
  | { type: "setOriginalMessage"; value: string }
  | { type: "setConversationBackground"; value: string }
  | { type: "setIntentCards"; cards: IntentCard[] }
  | { type: "updateIntentContent"; id: string; content: string }
  | { type: "deleteIntent"; id: string }
  | { type: "togglePreserved"; id: string }
  | { type: "setStrengthApproved"; value: boolean }
  | { type: "setLoading"; value: boolean }
  | { type: "setError"; value: string | null }
  | { type: "setResult"; result: TranslationResult | null };

function hasSoftenableIntent(cards: IntentCard[]): boolean {
  return cards.some((card) => card.markers.includes("softenable"));
}

function resetAnalysis(state: WorkflowState): WorkflowState {
  return {
    ...state,
    intentCards: [],
    strengthApproved: false,
    error: null,
    result: null
  };
}

function syncStrengthApproval(state: WorkflowState, cards: IntentCard[]): boolean {
  return hasSoftenableIntent(state.intentCards) && hasSoftenableIntent(cards)
    ? state.strengthApproved
    : false;
}

export function reducer(state: WorkflowState, action: WorkflowAction): WorkflowState {
  switch (action.type) {
    case "setConfig":
      return resetAnalysis({ ...state, config: action.config });
    case "setOriginalMessage":
      return resetAnalysis({ ...state, originalMessage: action.value });
    case "setConversationBackground":
      return resetAnalysis({ ...state, conversationBackground: action.value });
    case "setIntentCards":
      return {
        ...state,
        intentCards: action.cards.map((card) => ({ ...card, markers: [...card.markers] })),
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
      {
        const intentCards = state.intentCards.filter((card) => card.id !== action.id);
        return {
          ...state,
          intentCards,
          strengthApproved: syncStrengthApproval(state, intentCards),
          result: null
        };
      }
    case "togglePreserved": {
      if (!state.intentCards.some((card) => card.id === action.id)) {
        return state;
      }

      const intentCards = state.intentCards.map((card) => {
        if (card.id !== action.id) {
          return card;
        }
        const markers = card.markers.includes("primary")
          ? card.markers.filter((marker) => marker !== "primary")
          : [...card.markers, "primary" as const];
        return { ...card, markers };
      });

      return {
        ...state,
        intentCards,
        strengthApproved: syncStrengthApproval(state, intentCards),
        result: null
      };
    }
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
  return state.originalMessage.trim().length > 0;
}

export function selectPrimaryIntent(state: WorkflowState): IntentCard | undefined {
  return state.intentCards.find((card) => card.markers.includes("primary"));
}

export function selectCanTranslate(state: WorkflowState): boolean {
  return state.intentCards.some((card) => card.markers.includes("primary"));
}
