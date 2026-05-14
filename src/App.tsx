import { useReducer } from "react";
import { ConfigBar } from "./components/ConfigBar";
import { OriginalMessage } from "./components/OriginalMessage";
import { requestIntentCards } from "./lib/api";
import { initialWorkflowState, reducer, selectCanAnalyze } from "./state/workflow";

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialWorkflowState);

  async function analyze() {
    dispatch({ type: "setLoading", value: true });
    dispatch({ type: "setError", value: null });

    try {
      const response = await requestIntentCards({
        config: state.config,
        originalMessage: state.originalMessage
      });

      dispatch({
        type: "setIntentCards",
        cards: response.intentCards,
        questions: response.clarifyingQuestions
      });

      if (response.safetyRedirect) {
        dispatch({ type: "setError", value: response.safetyRedirect });
      }
    } catch (error) {
      dispatch({
        type: "setError",
        value:
          error instanceof Error
            ? error.message
            : "意图识别失败，请稍后重试。"
      });
    } finally {
      dispatch({ type: "setLoading", value: false });
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
      {state.error ? <div className="error-banner">{state.error}</div> : null}
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
