import type { ClarifyingQuestion } from "../shared/domain";

interface ClarifyingQuestionsProps {
  questions: ClarifyingQuestion[];
  answers: Record<string, string>;
  onChange: (id: string, value: string) => void;
}

export function ClarifyingQuestions({
  questions,
  answers,
  onChange
}: ClarifyingQuestionsProps) {
  if (questions.length === 0) {
    return null;
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <p className="step-label">03 补充上下文</p>
        <h2>回答可能影响翻译的问题</h2>
      </div>
      <div className="question-list">
        {questions.map((question) => (
          <label className="question-block" key={question.id}>
            <span>{question.question}</span>
            <small>{question.reason}</small>
            <textarea
              value={answers[question.id] ?? ""}
              onChange={(event) => onChange(question.id, event.target.value)}
              rows={3}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
