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

  await userEvent.clear(screen.getByRole("textbox", { name: "第 1 个意图内容" }));
  await userEvent.type(screen.getByRole("textbox", { name: "第 1 个意图内容" }), "我想提醒交付风险。");
  await userEvent.click(screen.getByRole("button", { name: "第 1 个意图：设为主意图" }));

  expect(onUpdate).toHaveBeenLastCalledWith("intent-1", "我想提醒交付风险。");
  expect(onToggle).toHaveBeenCalledWith("intent-1", "primary");
});

test("names controls per card and exposes active markers", async () => {
  const onDelete = vi.fn();
  const onToggle = vi.fn();
  const multiCards: IntentCard[] = [
    {
      ...cards[0]!,
      markers: ["primary", "sensitive"]
    },
    {
      id: "intent-2",
      type: "action",
      content: "我希望对方先评估影响。",
      confidence: "medium",
      markers: []
    }
  ];

  render(
    <IntentCards
      cards={multiCards}
      canTranslate
      onUpdate={vi.fn()}
      onDelete={onDelete}
      onToggle={onToggle}
    />
  );

  expect(screen.getByRole("textbox", { name: "第 2 个意图内容" })).toHaveValue("我希望对方先评估影响。");

  await userEvent.click(screen.getByRole("button", { name: "删除第 2 个意图" }));
  await userEvent.click(screen.getByRole("button", { name: "第 2 个意图：设为主意图" }));

  expect(screen.getByRole("button", { name: "第 1 个意图：取消主意图" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "第 1 个意图：敏感意图" })).toHaveAttribute("aria-pressed", "true");
  expect(onDelete).toHaveBeenCalledWith("intent-2");
  expect(onToggle).toHaveBeenCalledWith("intent-2", "primary");
});
