interface OriginalMessageProps {
  value: string;
  conversationBackground: string;
  canAnalyze: boolean;
  isLoading: boolean;
  hasAnalysis: boolean;
  onChange: (value: string) => void;
  onBackgroundChange: (value: string) => void;
  onAnalyze: () => void;
}

export function OriginalMessage({
  value,
  conversationBackground,
  canAnalyze,
  isLoading,
  hasAnalysis,
  onChange,
  onBackgroundChange,
  onAnalyze
}: OriginalMessageProps) {
  const buttonLabel = isLoading
    ? "识别中..."
    : hasAnalysis
      ? "重新识别意图"
      : "识别意图";

  return (
    <section className="panel">
      <div className="panel-heading">
        <p className="step-label">01 原话输入</p>
        <h2>先写下你原本想说的话</h2>
      </div>
      <label className="textarea-label">
        <span>对话背景</span>
        <textarea
          value={conversationBackground}
          onChange={(event) => onBackgroundChange(event.target.value)}
          placeholder="可选：补充关系、前情、冲突点或你担心被误会的地方。"
          rows={3}
        />
      </label>
      <label className="textarea-label">
        <span>原话</span>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="例如：你这个方案风险太高了，我们不能继续这样做。"
          rows={7}
        />
      </label>
      <div className="action-row">
        <button
          className="primary-action"
          type="button"
          disabled={!canAnalyze || isLoading}
          onClick={onAnalyze}
        >
          {buttonLabel}
        </button>
        {!canAnalyze ? (
          <span className="disabled-reason">填写原话后可识别</span>
        ) : null}
        {hasAnalysis ? (
          <span className="status-pill" aria-live="polite">
            已识别
          </span>
        ) : null}
      </div>
    </section>
  );
}
