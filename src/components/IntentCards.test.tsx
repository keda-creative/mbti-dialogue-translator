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

test("allows editing and choosing preserved intents", async () => {
  const onUpdate = vi.fn();
  const onTogglePreserved = vi.fn();

  render(
    <IntentCards
      cards={cards}
      canContinue={false}
      onUpdate={onUpdate}
      onDelete={vi.fn()}
      onTogglePreserved={onTogglePreserved}
    />
  );

  await userEvent.clear(screen.getByRole("textbox", { name: "第 1 个意图内容" }));
  await userEvent.type(screen.getByRole("textbox", { name: "第 1 个意图内容" }), "我想提醒交付风险。");
  await userEvent.click(screen.getByLabelText("保留这个意图"));

  expect(onUpdate).toHaveBeenLastCalledWith("intent-1", "我想提醒交付风险。");
  expect(onTogglePreserved).toHaveBeenCalledWith("intent-1");
  expect(screen.getByText("想让对方知道的事实、背景、判断或担心。")).toBeInTheDocument();
  expect(screen.getByText("至少选择一个要保留的意图。")).toBeInTheDocument();
});

test("names controls per card and exposes preserved state", async () => {
  const onDelete = vi.fn();
  const onTogglePreserved = vi.fn();
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
      canContinue
      onUpdate={vi.fn()}
      onDelete={onDelete}
      onTogglePreserved={onTogglePreserved}
    />
  );

  expect(screen.getByRole("textbox", { name: "第 2 个意图内容" })).toHaveValue("我希望对方先评估影响。");

  await userEvent.click(screen.getByRole("button", { name: "删除第 2 个意图" }));
  await userEvent.click(screen.getAllByLabelText("保留这个意图")[1]!);

  expect(screen.getAllByLabelText("保留这个意图")[0]).toBeChecked();
  expect(onDelete).toHaveBeenCalledWith("intent-2");
  expect(onTogglePreserved).toHaveBeenCalledWith("intent-2");
});
