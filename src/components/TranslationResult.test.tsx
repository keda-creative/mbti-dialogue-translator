import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TranslationResult as Result } from "../shared/domain";
import { TranslationResult } from "./TranslationResult";

const result: Result = {
  translatedMessage: "我想先确认一个风险点。",
  mbtiExplanation: "考虑到 B 是 ISTJ，可能更容易接收事实清晰的表达。",
  preservedIntents: ["提醒风险"],
  adjustedExpressions: ["降低责备感"],
  strategy: {
    informationOrder: "先事实",
    tone: "克制",
    evidenceStyle: "事实",
    relationshipSignal: "共同目标",
    misunderstandingRisk: "可能先回应语气",
    adjustments: []
  }
};

test("renders translation sections and copies message", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText } });

  render(<TranslationResult result={result} />);

  expect(screen.getByText("我想先确认一个风险点。")).toBeInTheDocument();
  expect(screen.getByText(/考虑到 B 是 ISTJ/)).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "复制改写" }));
  expect(writeText).toHaveBeenCalledWith("我想先确认一个风险点。");
});
