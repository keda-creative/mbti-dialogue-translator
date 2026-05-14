import { useReducer, useRef } from "react";
import { ConfigBar } from "./components/ConfigBar";
import { OriginalMessage } from "./components/OriginalMessage";
import { requestIntentCards } from "./lib/api";
import type { TranslatorConfig } from "./shared/domain";
import { initialWorkflowState, reducer, selectCanAnalyze } from "./state/workflow";

interface AnalysisRequestSnapshot {
  config: TranslatorConfig;
  originalMessage: string;
}

function configsMatch(left: TranslatorConfig, right: TranslatorConfig): boolean {
  return (
    left.senderType === right.senderType &&
    left.receiverType === right.receiverType &&
    left.scenario === right.scenario
  );
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialWorkflowState);
  const latestInputRef = useRef<AnalysisRequestSnapshot>({
    config: state.config,
    originalMessage: state.originalMessage
  });
  const activeRequestIdRef = useRef(0);

  latestInputRef.current = {
    config: state.config,
    originalMessage: state.originalMessage
  };

  function isCurrentRequest(
    requestId: number,
    request: AnalysisRequestSnapshot
  ): boolean {
    const latestInput = latestInputRef.current;
    return (
      activeRequestIdRef.current === requestId &&
      latestInput.originalMessage === request.originalMessage &&
      configsMatch(latestInput.config, request.config)
    );
  }

  async function analyze() {
    const request = {
      config: state.config,
      originalMessage: state.originalMessage
    };
    const requestId = activeRequestIdRef.current + 1;
    activeRequestIdRef.current = requestId;

    dispatch({ type: "setLoading", value: true });
    dispatch({ type: "setError", value: null });

    try {
      const response = await requestIntentCards(request);

      if (!isCurrentRequest(requestId, request)) {
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
      if (!isCurrentRequest(requestId, request)) {
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
      if (activeRequestIdRef.current === requestId) {
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
        <OriginalMessage
          value={state.originalMessage}
          canAnalyze={selectCanAnalyze(state)}
          isLoading={state.isLoading}
          onChange={(value) => dispatch({ type: "setOriginalMessage", value })}
          onAnalyze={analyze}
        />
      </div>
    </main>
  );
}
