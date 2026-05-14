import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { requestIntentCards } from "./lib/api";

vi.mock("./lib/api", () => ({
  requestIntentCards: vi.fn()
}));

beforeEach(() => {
  vi.mocked(requestIntentCards).mockReset();
});

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

test("ignores a stale intent response after the user changes the request input", async () => {
  const user = userEvent.setup();
  let resolveResponse: (
    value: Awaited<ReturnType<typeof requestIntentCards>>
  ) => void = () => {};
  vi.mocked(requestIntentCards).mockReturnValue(
    new Promise((resolve) => {
      resolveResponse = resolve;
    })
  );

  render(<App />);

  await user.type(screen.getByLabelText("原话"), "你这样让我很没有安全感。");
  await user.click(screen.getByRole("button", { name: "识别意图" }));
  await user.selectOptions(screen.getByLabelText("接收者 B"), "ESFP");
  await user.type(screen.getByLabelText("原话"), "我现在补充了新上下文。");

  resolveResponse({
    intentCards: [
      {
        id: "intent-1",
        type: "emotion",
        content: "旧请求识别出的不安全感",
        confidence: "high",
        markers: []
      }
    ],
    clarifyingQuestions: [],
    safetyRedirect: "旧请求安全提示"
  });

  await waitFor(() =>
    expect(screen.getByRole("button", { name: "识别意图" })).toBeEnabled()
  );
  expect(screen.queryByText("旧请求安全提示")).not.toBeInTheDocument();
});
