interface OriginalMessageProps {
  value: string;
  canAnalyze: boolean;
  isLoading: boolean;
  onChange: (value: string) => void;
  onAnalyze: () => void;
}

export function OriginalMessage({
  value,
  canAnalyze,
  isLoading,
  onChange,
  onAnalyze
}: OriginalMessageProps) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <p className="step-label">01 原话输入</p>
        <h2>先写下你原本想说的话</h2>
      </div>
      <label className="textarea-label">
        <span>原话</span>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="例如：你这个方案风险太高了，我们不能继续这样做。"
          rows={7}
        />
      </label>
      <button
        className="primary-action"
        type="button"
        disabled={!canAnalyze || isLoading}
        onClick={onAnalyze}
      >
        {isLoading ? "识别中..." : "识别意图"}
      </button>
    </section>
  );
}
