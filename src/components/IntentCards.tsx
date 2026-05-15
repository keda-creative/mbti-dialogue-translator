import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { INTENT_TYPES, type IntentCard } from "../shared/domain";

interface IntentCardsProps {
  cards: IntentCard[];
  canContinue: boolean;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onTogglePreserved: (id: string) => void;
}

interface IntentCardItemProps {
  card: IntentCard;
  position: number;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onTogglePreserved: (id: string) => void;
}

function getIntentType(card: IntentCard) {
  return INTENT_TYPES.find((type) => type.id === card.type);
}

function isPreserved(card: IntentCard): boolean {
  return card.markers.includes("primary");
}

function IntentCardItem({
  card,
  position,
  onUpdate,
  onDelete,
  onTogglePreserved
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
      <label className="preserve-line">
        <input
          checked={isPreserved(card)}
          type="checkbox"
          onChange={() => onTogglePreserved(card.id)}
        />
        <span>保留这个意图</span>
      </label>
    </article>
  );
}

export function IntentCards({
  cards,
  canContinue,
  onUpdate,
  onDelete,
  onTogglePreserved
}: IntentCardsProps) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <section className="panel intent-panel">
      <div className="panel-heading">
        <p className="step-label">02 意图确认</p>
        <h2>选择翻译必须保留的意图</h2>
        <p className="panel-intro">
          勾选你希望译文一定保留的意思。没勾选的意图不会被当成翻译重点。
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
            onTogglePreserved={onTogglePreserved}
          />
        ))}
      </div>
      {!canContinue ? <p className="hint">至少选择一个要保留的意图。</p> : null}
    </section>
  );
}
