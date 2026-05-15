import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { INTENT_TYPES, type IntentCard, type IntentMarker } from "../shared/domain";

interface IntentCardsProps {
  cards: IntentCard[];
  canTranslate: boolean;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, marker: IntentMarker) => void;
}

interface IntentCardItemProps {
  card: IntentCard;
  position: number;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, marker: IntentMarker) => void;
}

const markerCopy: Record<IntentMarker, { label: string; helper: string }> = {
  primary: {
    label: "主意图",
    helper: "译文必须优先保留的核心意思，通常只选一个。"
  },
  sensitive: {
    label: "敏感意图",
    helper: "处理不好容易伤害关系、边界或信任，翻译时会更谨慎。"
  },
  softenable: {
    label: "可弱化",
    helper: "允许后可把语气放缓，但不能改变真正意思。"
  }
};

function getIntentType(card: IntentCard) {
  return INTENT_TYPES.find((type) => type.id === card.type);
}

function markerClass(card: IntentCard, marker: IntentMarker): string {
  return card.markers.includes(marker) ? "marker active" : "marker";
}

function isMarkerActive(card: IntentCard, marker: IntentMarker): boolean {
  return card.markers.includes(marker);
}

function IntentCardItem({
  card,
  position,
  onUpdate,
  onDelete,
  onToggle
}: IntentCardItemProps) {
  const [draft, setDraft] = useState(card.content);
  const cardLabel = `第 ${position} 个意图`;
  const intentType = getIntentType(card);

  useEffect(() => {
    setDraft(card.content);
  }, [card.content]);

  function updateDraft(value: string) {
    setDraft(value);
    onUpdate(card.id, value);
  }

  return (
    <article className="intent-card">
      <div className="intent-card-header">
        <div>
          <span className="intent-type">{intentType?.label ?? card.type}</span>
          {intentType ? <p className="intent-helper">{intentType.helper}</p> : null}
        </div>
        <button
          aria-label={`删除${cardLabel}`}
          className="icon-button"
          type="button"
          onClick={() => onDelete(card.id)}
        >
          <Trash2 aria-hidden="true" size={16} strokeWidth={2} />
        </button>
      </div>
      <label className="textarea-label">
        <span>意图内容</span>
        <textarea
          aria-label={`${cardLabel}内容`}
          value={draft}
          onChange={(event) => updateDraft(event.target.value)}
          rows={3}
        />
      </label>
      <div className="marker-row" aria-label="意图标记">
        {(["primary", "sensitive", "softenable"] as const).map((marker) => (
          <div className="marker-control" key={marker}>
            <button
              aria-label={`${cardLabel}：${markerCopy[marker].label}`}
              aria-pressed={isMarkerActive(card, marker)}
              className={markerClass(card, marker)}
              type="button"
              onClick={() => onToggle(card.id, marker)}
            >
              {markerCopy[marker].label}
            </button>
            <small>{markerCopy[marker].helper}</small>
          </div>
        ))}
      </div>
    </article>
  );
}

export function IntentCards({
  cards,
  canTranslate,
  onUpdate,
  onDelete,
  onToggle
}: IntentCardsProps) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <section className="panel intent-panel">
      <div className="panel-heading">
        <p className="step-label">02 意图确认</p>
        <h2>确认真正想表达的意图</h2>
        <p className="panel-intro">
          先看每张卡是不是你的真实意思，再用标记告诉系统翻译时该优先保留什么、哪里要谨慎处理。
        </p>
      </div>
      <div className="intent-list">
        {cards.map((card, index) => (
          <IntentCardItem
            key={card.id}
            card={card}
            position={index + 1}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onToggle={onToggle}
          />
        ))}
      </div>
      {!canTranslate ? <p className="hint">请选择一个主意图后再生成翻译。</p> : null}
    </section>
  );
}
