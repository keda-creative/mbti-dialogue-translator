import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

test("lets the user configure direction and type an original message", async () => {
  render(<App />);

  await userEvent.selectOptions(screen.getByLabelText("发送者 A"), "INTJ");
  await userEvent.selectOptions(screen.getByLabelText("接收者 B"), "ESFP");
  await userEvent.selectOptions(screen.getByLabelText("使用场景"), "romantic");
  await userEvent.type(screen.getByLabelText("原话"), "你这样让我很没有安全感。");

  expect(screen.getByDisplayValue("INTJ")).toBeInTheDocument();
  expect(screen.getByDisplayValue("ESFP")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "识别意图" })).toBeEnabled();
});
