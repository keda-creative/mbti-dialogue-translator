import { Clipboard } from "lucide-react";
import type { TranslationResult as Result } from "../shared/domain";

interface TranslationResultProps {
  result: Result | null;
}

export function TranslationResult({ result }: TranslationResultProps) {
  if (!result) {
    return null;
  }

  const translation = result;

  async function copy() {
    await navigator.clipboard.writeText(translation.translatedMessage);
  }

  return (
    <section className="panel result-panel">
      <div className="panel-heading">
        <p className="step-label">03 翻译结果</p>
        <h2>可以复制发送的版本</h2>
      </div>
      <div className="translated-message">{result.translatedMessage}</div>
      <button className="primary-action icon-text" type="button" onClick={copy}>
        <Clipboard size={16} aria-hidden="true" />
        复制改写
      </button>
      <div className="result-grid">
        <section>
          <h3>MBTI 翻译说明</h3>
          <p>{result.mbtiExplanation}</p>
        </section>
        <section>
          <h3>保留了哪些意图</h3>
          <ul>
            {result.preservedIntents.map((intent) => (
              <li key={intent}>{intent}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3>调整了哪些表达</h3>
          <ul>
            {result.adjustedExpressions.map((expression) => (
              <li key={expression}>{expression}</li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
