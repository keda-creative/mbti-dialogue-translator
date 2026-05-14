import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrengthGate } from "./StrengthGate";

test("asks for approval before softening strong expression", async () => {
  const onChange = vi.fn();
  render(<StrengthGate approved={false} onChange={onChange} />);

  expect(screen.getByText("表达强度确认")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("checkbox", { name: "允许系统弱化强烈责备、焦虑或控制感" }));

  expect(onChange).toHaveBeenCalledWith(true);
});
