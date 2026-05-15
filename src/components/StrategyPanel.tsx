import type { TranslationStrategy, TranslatorConfig } from "../shared/domain";
import { summarizeDirection } from "../shared/profiles";

interface StrategyPanelProps {
  config: TranslatorConfig;
  strategy: TranslationStrategy | null;
}

export function StrategyPanel({ config, strategy }: StrategyPanelProps) {
  return (
    <aside className="strategy-panel">
      <p className="step-label">沟通差异摘要</p>
      <h2>
        {config.senderType} → {config.receiverType}
      </h2>
      <p>{summarizeDirection(config.senderType, config.receiverType)}</p>
      {strategy ? (
        <dl>
          <div>
            <dt>信息顺序</dt>
            <dd>{strategy.informationOrder}</dd>
          </div>
          <div>
            <dt>语气</dt>
            <dd>{strategy.tone}</dd>
          </div>
          <div>
            <dt>误读风险</dt>
            <dd>{strategy.misunderstandingRisk}</dd>
          </div>
        </dl>
      ) : (
        <p className="hint">生成翻译后，这里会显示当前翻译策略。</p>
      )}
    </aside>
  );
}
