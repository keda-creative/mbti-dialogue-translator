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

function getIntentTypeLabel(card: IntentCard): string {
  return INTENT_TYPES.find((type) => type.id === card.type)?.label ?? card.type;
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
  const primaryLabel = isMarkerActive(card, "primary") ? "取消主意图" : "设为主意图";

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
        <span className="intent-type">{getIntentTypeLabel(card)}</span>
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
        <button
          aria-label={`${cardLabel}：${primaryLabel}`}
          aria-pressed={isMarkerActive(card, "primary")}
          className={markerClass(card, "primary")}
          type="button"
          onClick={() => onToggle(card.id, "primary")}
        >
          {primaryLabel}
        </button>
        <button
          aria-label={`${cardLabel}：敏感意图`}
          aria-pressed={isMarkerActive(card, "sensitive")}
          className={markerClass(card, "sensitive")}
          type="button"
          onClick={() => onToggle(card.id, "sensitive")}
        >
          敏感意图
        </button>
        <button
          aria-label={`${cardLabel}：可弱化`}
          aria-pressed={isMarkerActive(card, "softenable")}
          className={markerClass(card, "softenable")}
          type="button"
          onClick={() => onToggle(card.id, "softenable")}
        >
          可弱化
        </button>
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
