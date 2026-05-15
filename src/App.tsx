import { useEffect, useReducer, useRef, useState } from "react";
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
  selectCanTranslate,
  type WorkflowState
} from "./state/workflow";

const DRAFT_STORAGE_KEY = "mbti-dialogue-translator-draft";
type WorkflowStep = "input" | "intent" | "strength" | "result";

interface AnalysisRequestSnapshot {
  config: TranslatorConfig;
  originalMessage: string;
  conversationBackground: string;
}

interface TranslationRequestSnapshot extends AnalysisRequestSnapshot {
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

function readDraftState(): WorkflowState {
  if (typeof window === "undefined") {
    return initialWorkflowState;
  }

  try {
    const stored = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!stored) {
      return initialWorkflowState;
    }

    const parsed = JSON.parse(stored) as Partial<WorkflowState>;
    return {
      ...initialWorkflowState,
      conversationBackground:
        typeof parsed.conversationBackground === "string"
          ? parsed.conversationBackground
          : "",
      originalMessage:
        typeof parsed.originalMessage === "string" ? parsed.originalMessage : ""
    };
  } catch {
    return initialWorkflowState;
  }
}

function writeDraftState(state: WorkflowState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    DRAFT_STORAGE_KEY,
    JSON.stringify({
      conversationBackground: state.conversationBackground,
      originalMessage: state.originalMessage
    })
  );
}

function formatPreview(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }
  return trimmed.length > 72 ? `${trimmed.slice(0, 72)}...` : trimmed;
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, readDraftState);
  const [activeStep, setActiveStep] = useState<WorkflowStep>("input");
  const hasSoftenableIntent = state.intentCards.some((card) =>
    card.markers.includes("softenable")
  );
  const preservedIntents = state.intentCards.filter((card) =>
    card.markers.includes("primary")
  );
  const currentStep: WorkflowStep =
    activeStep === "result" && state.result
      ? "result"
      : activeStep === "strength" &&
          state.intentCards.length > 0 &&
          hasSoftenableIntent
        ? "strength"
        : activeStep === "intent" && state.intentCards.length > 0
        ? "intent"
        : "input";
  const latestInputRef = useRef<AnalysisRequestSnapshot>({
    config: state.config,
    originalMessage: state.originalMessage,
    conversationBackground: state.conversationBackground
  });
  const latestTranslationInputRef = useRef<TranslationRequestSnapshot>({
    config: state.config,
    originalMessage: state.originalMessage,
    conversationBackground: state.conversationBackground,
    intentCards: state.intentCards,
    strengthApproved: state.strengthApproved
  });
  const activeAnalysisRequestIdRef = useRef(0);
  const activeTranslationRequestIdRef = useRef(0);

  latestInputRef.current = {
    config: state.config,
    originalMessage: state.originalMessage,
    conversationBackground: state.conversationBackground
  };
  latestTranslationInputRef.current = {
    config: state.config,
    originalMessage: state.originalMessage,
    conversationBackground: state.conversationBackground,
    intentCards: state.intentCards,
    strengthApproved: state.strengthApproved
  };

  useEffect(() => {
    writeDraftState(state);
  }, [state.conversationBackground, state.originalMessage]);

  function isCurrentAnalysisRequest(
    requestId: number,
    request: AnalysisRequestSnapshot
  ): boolean {
    const latestInput = latestInputRef.current;
    return (
      activeAnalysisRequestIdRef.current === requestId &&
      latestInput.originalMessage === request.originalMessage &&
      latestInput.conversationBackground === request.conversationBackground &&
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
      latestInput.conversationBackground === request.conversationBackground &&
      latestInput.strengthApproved === request.strengthApproved &&
      configsMatch(latestInput.config, request.config) &&
      serializeIntentCards(latestInput.intentCards) ===
        serializeIntentCards(request.intentCards)
    );
  }

  async function analyze() {
    const request = {
      config: state.config,
      originalMessage: state.originalMessage,
      conversationBackground: state.conversationBackground
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
        cards: response.intentCards
      });
      setActiveStep("intent");

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
      conversationBackground: state.conversationBackground,
      intentCards: state.intentCards,
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
      setActiveStep("result");
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
        onChange={(config) => {
          setActiveStep("input");
          dispatch({ type: "setConfig", config });
        }}
      />
      {state.error ? (
        <div className="error-banner" role="alert">
          {state.error}
        </div>
      ) : null}
      <div className="workspace">
        <div className="flow-column">
          {currentStep === "input" ? (
            <OriginalMessage
              value={state.originalMessage}
              conversationBackground={state.conversationBackground}
              canAnalyze={selectCanAnalyze(state)}
              isLoading={state.isLoading}
              hasAnalysis={state.intentCards.length > 0}
              onChange={(value) => {
                setActiveStep("input");
                dispatch({ type: "setOriginalMessage", value });
              }}
              onBackgroundChange={(value) => {
                setActiveStep("input");
                dispatch({ type: "setConversationBackground", value });
              }}
              onAnalyze={analyze}
            />
          ) : (
            <section className="panel step-summary">
              <div>
                <p className="step-label">01 原话输入</p>
                <h2>已识别这段原话</h2>
                <p>{formatPreview(state.originalMessage, "还没有填写原话。")}</p>
                {state.conversationBackground.trim() ? (
                  <small>
                    背景：{formatPreview(state.conversationBackground, "")}
                  </small>
                ) : null}
              </div>
              <button
                className="secondary-action"
                type="button"
                onClick={() => setActiveStep("input")}
              >
                返回修改原话
              </button>
            </section>
          )}
          {currentStep === "intent" ? (
            <>
              <IntentCards
                cards={state.intentCards}
                canContinue={selectCanTranslate(state)}
                onUpdate={(id, content) => {
                  setActiveStep("intent");
                  dispatch({ type: "updateIntentContent", id, content });
                }}
                onDelete={(id) => {
                  setActiveStep("intent");
                  dispatch({ type: "deleteIntent", id });
                }}
                onTogglePreserved={(id) => {
                  setActiveStep("intent");
                  dispatch({ type: "togglePreserved", id });
                }}
              />
              <button
                className="primary-action"
                type="button"
                disabled={!selectCanTranslate(state) || state.isLoading}
                onClick={() => {
                  if (hasSoftenableIntent) {
                    setActiveStep("strength");
                    return;
                  }
                  void translate();
                }}
              >
                {hasSoftenableIntent
                  ? "确认意图"
                  : state.isLoading
                    ? "生成中..."
                    : "生成翻译"}
              </button>
            </>
          ) : null}
          {currentStep === "strength" ? (
            <>
              <section className="panel step-summary">
                <div>
                  <p className="step-label">02 意图确认</p>
                  <h2>已选择 {preservedIntents.length} 个保留意图</h2>
                  <p>
                    {formatPreview(
                      preservedIntents[0]?.content ?? "",
                      "尚未选择保留意图"
                    )}
                  </p>
                </div>
                <button
                  className="secondary-action"
                  type="button"
                  onClick={() => setActiveStep("intent")}
                >
                  返回修改意图
                </button>
              </section>
              <StrengthGate
                approved={state.strengthApproved}
                onChange={(value) => {
                  setActiveStep("strength");
                  dispatch({ type: "setStrengthApproved", value });
                }}
              />
              <button
                className="primary-action"
                type="button"
                disabled={state.isLoading}
                onClick={translate}
              >
                {state.isLoading ? "生成中..." : "生成翻译"}
              </button>
            </>
          ) : null}
          {currentStep === "result" ? (
            <>
              <section className="panel step-summary">
                <div>
                  <p className="step-label">02 意图确认</p>
                  <h2>已选择 {preservedIntents.length} 个保留意图</h2>
                  <p>
                    {formatPreview(
                      preservedIntents[0]?.content ?? "",
                      "尚未选择保留意图"
                    )}
                  </p>
                </div>
                <button
                  className="secondary-action"
                  type="button"
                  onClick={() => setActiveStep("intent")}
                >
                  返回修改意图
                </button>
              </section>
              {hasSoftenableIntent ? (
                <section className="panel step-summary">
                  <div>
                    <p className="step-label">03 补充确认</p>
                    <h2>已确认表达强度</h2>
                    <p>
                      {state.strengthApproved
                        ? "允许系统把强烈表达处理得更柔和。"
                        : "保留原话里的表达强度，只调整顺序和清晰度。"}
                    </p>
                  </div>
                  <button
                    className="secondary-action"
                    type="button"
                    onClick={() => setActiveStep("strength")}
                  >
                    返回修改补充确认
                  </button>
                </section>
              ) : null}
              <TranslationResult
                result={state.result}
                stepLabel={hasSoftenableIntent ? "04 翻译结果" : "03 翻译结果"}
              />
            </>
          ) : null}
        </div>
        <StrategyPanel
          config={state.config}
          strategy={state.result?.strategy || null}
        />
      </div>
    </main>
  );
}
