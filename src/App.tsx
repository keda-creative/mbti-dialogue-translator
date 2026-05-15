import { useReducer, useRef } from "react";
import { ClarifyingQuestions } from "./components/ClarifyingQuestions";
import { ConfigBar } from "./components/ConfigBar";
import { IntentCards } from "./components/IntentCards";
import { OriginalMessage } from "./components/OriginalMessage";
import { StrategyPanel } from "./components/StrategyPanel";
import { StrengthGate } from "./components/StrengthGate";
import { TranslationResult } from "./components/TranslationResult";
import { requestIntentCards, requestTranslation } from "./lib/api";
import type { IntentCard, TranslatorConfig } from "./shared/domain";
import {
  initialWorkflowState,
  reducer,
  selectCanAnalyze,
  selectCanTranslate
} from "./state/workflow";

interface AnalysisRequestSnapshot {
  config: TranslatorConfig;
  originalMessage: string;
}

interface TranslationRequestSnapshot extends AnalysisRequestSnapshot {
  clarificationAnswers: Record<string, string>;
  intentCards: IntentCard[];
  strengthApproved: boolean;
}

function configsMatch(left: TranslatorConfig, right: TranslatorConfig): boolean {
  return (
    left.senderType === right.senderType &&
    left.receiverType === right.receiverType &&
    left.scenario === right.scenario
  );
}

function serializeIntentCards(cards: IntentCard[]): string {
  return JSON.stringify(cards);
}

function serializeAnswers(answers: Record<string, string>): string {
  return JSON.stringify(answers);
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialWorkflowState);
  const hasSoftenableIntent = state.intentCards.some((card) =>
    card.markers.includes("softenable")
  );
  const latestInputRef = useRef<AnalysisRequestSnapshot>({
    config: state.config,
    originalMessage: state.originalMessage
  });
  const latestTranslationInputRef = useRef<TranslationRequestSnapshot>({
    config: state.config,
    originalMessage: state.originalMessage,
    intentCards: state.intentCards,
    clarificationAnswers: state.clarificationAnswers,
    strengthApproved: state.strengthApproved
  });
  const activeAnalysisRequestIdRef = useRef(0);
  const activeTranslationRequestIdRef = useRef(0);

  latestInputRef.current = {
    config: state.config,
    originalMessage: state.originalMessage
  };
  latestTranslationInputRef.current = {
    config: state.config,
    originalMessage: state.originalMessage,
    intentCards: state.intentCards,
    clarificationAnswers: state.clarificationAnswers,
    strengthApproved: state.strengthApproved
  };

  function isCurrentAnalysisRequest(
    requestId: number,
    request: AnalysisRequestSnapshot
  ): boolean {
    const latestInput = latestInputRef.current;
    return (
      activeAnalysisRequestIdRef.current === requestId &&
      latestInput.originalMessage === request.originalMessage &&
      configsMatch(latestInput.config, request.config)
    );
  }

  function isCurrentTranslationRequest(
    requestId: number,
    request: TranslationRequestSnapshot
  ): boolean {
    const latestInput = latestTranslationInputRef.current;
    return (
      activeTranslationRequestIdRef.current === requestId &&
      latestInput.originalMessage === request.originalMessage &&
      latestInput.strengthApproved === request.strengthApproved &&
      configsMatch(latestInput.config, request.config) &&
      serializeIntentCards(latestInput.intentCards) ===
        serializeIntentCards(request.intentCards) &&
      serializeAnswers(latestInput.clarificationAnswers) ===
        serializeAnswers(request.clarificationAnswers)
    );
  }

  async function analyze() {
    const request = {
      config: state.config,
      originalMessage: state.originalMessage
    };
    const requestId = activeAnalysisRequestIdRef.current + 1;
    activeAnalysisRequestIdRef.current = requestId;

    dispatch({ type: "setLoading", value: true });
    dispatch({ type: "setError", value: null });

    try {
      const response = await requestIntentCards(request);

      if (!isCurrentAnalysisRequest(requestId, request)) {
        return;
      }

      dispatch({
        type: "setIntentCards",
        cards: response.intentCards,
        questions: response.clarifyingQuestions
      });

      if (response.safetyRedirect) {
        dispatch({ type: "setError", value: response.safetyRedirect });
      }
    } catch (error) {
      if (!isCurrentAnalysisRequest(requestId, request)) {
        return;
      }

      dispatch({
        type: "setError",
        value:
          error instanceof Error
            ? error.message
            : "意图识别失败，请稍后重试。"
      });
    } finally {
      if (activeAnalysisRequestIdRef.current === requestId) {
        dispatch({ type: "setLoading", value: false });
      }
    }
  }

  async function translate() {
    const request = {
      config: state.config,
      originalMessage: state.originalMessage,
      intentCards: state.intentCards,
      clarificationAnswers: state.clarificationAnswers,
      strengthApproved: state.strengthApproved
    };
    const requestId = activeTranslationRequestIdRef.current + 1;
    activeTranslationRequestIdRef.current = requestId;

    dispatch({ type: "setLoading", value: true });
    dispatch({ type: "setError", value: null });

    try {
      const result = await requestTranslation(request);

      if (!isCurrentTranslationRequest(requestId, request)) {
        return;
      }

      dispatch({ type: "setResult", result });
    } catch (error) {
      if (!isCurrentTranslationRequest(requestId, request)) {
        return;
      }

      dispatch({
        type: "setError",
        value:
          error instanceof Error
            ? error.message
            : "翻译生成失败，请稍后重试。"
      });
    } finally {
      if (activeTranslationRequestIdRef.current === requestId) {
        dispatch({ type: "setLoading", value: false });
      }
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-strip">
        <p className="eyebrow">先保真，再翻译</p>
        <h1>MBTI 对话翻译器</h1>
        <p className="intro">把同一个意图，换成对方更容易接收的信息入口。</p>
      </section>
      <ConfigBar
        config={state.config}
        onChange={(config) => dispatch({ type: "setConfig", config })}
      />
      {state.error ? (
        <div className="error-banner" role="alert">
          {state.error}
        </div>
      ) : null}
      <div className="workspace">
        <div className="flow-column">
          <OriginalMessage
            value={state.originalMessage}
            canAnalyze={selectCanAnalyze(state)}
            isLoading={state.isLoading}
            onChange={(value) => dispatch({ type: "setOriginalMessage", value })}
            onAnalyze={analyze}
          />
          <IntentCards
            cards={state.intentCards}
            canTranslate={selectCanTranslate(state)}
            onUpdate={(id, content) =>
              dispatch({ type: "updateIntentContent", id, content })
            }
            onDelete={(id) => dispatch({ type: "deleteIntent", id })}
            onToggle={(id, marker) =>
              dispatch({ type: "toggleMarker", id, marker })
            }
          />
          <ClarifyingQuestions
            questions={state.clarifyingQuestions}
            answers={state.clarificationAnswers}
            onChange={(id, value) =>
              dispatch({ type: "setClarificationAnswer", id, value })
            }
          />
          {hasSoftenableIntent ? (
            <StrengthGate
              approved={state.strengthApproved}
              onChange={(value) =>
                dispatch({ type: "setStrengthApproved", value })
              }
            />
          ) : null}
          {state.intentCards.length > 0 ? (
            <button
              className="primary-action"
              type="button"
              disabled={!selectCanTranslate(state) || state.isLoading}
              onClick={translate}
            >
              {state.isLoading ? "生成中..." : "生成翻译"}
            </button>
          ) : null}
          <TranslationResult result={state.result} />
        </div>
        <StrategyPanel
          config={state.config}
          strategy={state.result?.strategy || null}
        />
      </div>
    </main>
  );
}
