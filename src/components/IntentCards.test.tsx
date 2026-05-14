import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { IntentCard } from "../shared/domain";
import { IntentCards } from "./IntentCards";

const cards: IntentCard[] = [
  {
    id: "intent-1",
    type: "information",
    content: "我想提醒方案风险。",
    confidence: "high",
    markers: []
  }
];

test("allows editing and primary marking", async () => {
  const onUpdate = vi.fn();
  const onToggle = vi.fn();

  render(<IntentCards cards={cards} canTranslate={false} onUpdate={onUpdate} onDelete={vi.fn()} onToggle={onToggle} />);

  await userEvent.clear(screen.getByLabelText("意图内容"));
  await userEvent.type(screen.getByLabelText("意图内容"), "我想提醒交付风险。");
  await userEvent.click(screen.getByRole("button", { name: "设为主意图" }));

  expect(onUpdate).toHaveBeenLastCalledWith("intent-1", "我想提醒交付风险。");
  expect(onToggle).toHaveBeenCalledWith("intent-1", "primary");
});
