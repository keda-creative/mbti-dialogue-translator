interface StrengthGateProps {
  approved: boolean;
  onChange: (approved: boolean) => void;
}

export function StrengthGate({ approved, onChange }: StrengthGateProps) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <p className="step-label">04 表达强度</p>
        <h2>表达强度确认</h2>
      </div>
      <p className="gate-copy">
        系统识别到原话里可能有较强的责备、焦虑或控制感。只有在你明确允许时，翻译才会把这类表达处理得更柔和。
      </p>
      <label className="checkbox-line">
        <input
          checked={approved}
          type="checkbox"
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>允许系统弱化强烈责备、焦虑或控制感</span>
      </label>
    </section>
  );
}
