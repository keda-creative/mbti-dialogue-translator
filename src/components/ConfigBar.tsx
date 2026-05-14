import { MBTI_TYPES, SCENARIOS, type TranslatorConfig } from "../shared/domain";

interface ConfigBarProps {
  config: TranslatorConfig;
  onChange: (config: TranslatorConfig) => void;
}

export function ConfigBar({ config, onChange }: ConfigBarProps) {
  return (
    <section className="config-bar" aria-label="翻译配置">
      <label>
        <span>发送者 A</span>
        <select
          value={config.senderType}
          onChange={(event) =>
            onChange({
              ...config,
              senderType: event.target.value as TranslatorConfig["senderType"]
            })
          }
        >
          {MBTI_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>接收者 B</span>
        <select
          value={config.receiverType}
          onChange={(event) =>
            onChange({
              ...config,
              receiverType: event.target.value as TranslatorConfig["receiverType"]
            })
          }
        >
          {MBTI_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>使用场景</span>
        <select
          value={config.scenario}
          onChange={(event) =>
            onChange({
              ...config,
              scenario: event.target.value as TranslatorConfig["scenario"]
            })
          }
        >
          {SCENARIOS.map((scenario) => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.label}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
