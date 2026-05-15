import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { requestIntentCards, requestTranslation } from "./lib/api";

vi.mock("./lib/api", () => ({
  requestIntentCards: vi.fn(),
  requestTranslation: vi.fn()
}));

beforeEach(() => {
  vi.mocked(requestIntentCards).mockReset();
  vi.mocked(requestTranslation).mockReset();
  localStorage.clear();
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

test("sends optional conversation background with intent analysis", async () => {
  const user = userEvent.setup();
  vi.mocked(requestIntentCards).mockResolvedValue({
    intentCards: [
      {
        id: "intent-1",
        type: "information",
        content: "我想提醒方案风险。",
        confidence: "high",
        markers: ["primary"]
      }
    ],
    clarifyingQuestions: [],
    safetyRedirect: null
  });

  render(<App />);

  await user.type(screen.getByLabelText("对话背景"), "客户要求今天确认方案。");
  await user.type(screen.getByLabelText("原话"), "这个方案风险太高了。");
  await user.click(screen.getByRole("button", { name: "识别意图" }));

  expect(requestIntentCards).toHaveBeenCalledWith(
    expect.objectContaining({
      conversationBackground: "客户要求今天确认方案。",
      originalMessage: "这个方案风险太高了。"
    })
  );
});

test("shows a clear recognized state after intent analysis succeeds", async () => {
  const user = userEvent.setup();
  vi.mocked(requestIntentCards).mockResolvedValue({
    intentCards: [
      {
        id: "intent-1",
        type: "information",
        content: "我想提醒方案风险。",
        confidence: "high",
        markers: ["primary"]
      }
    ],
    clarifyingQuestions: [],
    safetyRedirect: null
  });

  render(<App />);

  await user.type(screen.getByLabelText("原话"), "这个方案风险太高了。");
  await user.click(screen.getByRole("button", { name: "识别意图" }));

  expect(await screen.findByText("已识别")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "重新识别意图" })
  ).toBeEnabled();
});

test("restores draft text after refresh so the analyze button remains usable", () => {
  localStorage.setItem(
    "mbti-dialogue-translator-draft",
    JSON.stringify({
      conversationBackground: "昨晚刚和对方讨论过预算。",
      originalMessage: "这个方案风险太高了。"
    })
  );

  render(<App />);

  expect(screen.getByLabelText("对话背景")).toHaveValue(
    "昨晚刚和对方讨论过预算。"
  );
  expect(screen.getByLabelText("原话")).toHaveValue("这个方案风险太高了。");
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

test("ignores a stale translation response after the user changes the message", async () => {
  const user = userEvent.setup();
  vi.mocked(requestIntentCards).mockResolvedValue({
    intentCards: [
      {
        id: "intent-1",
        type: "information",
        content: "我想提醒方案风险。",
        confidence: "high",
        markers: ["primary"]
      }
    ],
    clarifyingQuestions: [],
    safetyRedirect: null
  });

  let resolveTranslation: (
    value: Awaited<ReturnType<typeof requestTranslation>>
  ) => void = () => {};
  vi.mocked(requestTranslation).mockReturnValue(
    new Promise((resolve) => {
      resolveTranslation = resolve;
    })
  );

  render(<App />);

  await user.type(screen.getByLabelText("原话"), "你这个方案风险太高了。");
  await user.click(screen.getByRole("button", { name: "识别意图" }));
  expect(await screen.findByText("我想提醒方案风险。")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "生成翻译" }));
  await user.type(screen.getByLabelText("原话"), "我补充了新的上下文。");

  resolveTranslation({
    translatedMessage: "旧请求生成的翻译",
    mbtiExplanation: "考虑到 B 是 ISTJ，可能更容易接收事实清晰的表达。",
    preservedIntents: ["我想提醒方案风险。"],
    adjustedExpressions: ["保留表达强度"],
    strategy: {
      informationOrder: "先事实",
      tone: "克制",
      evidenceStyle: "事实",
      relationshipSignal: "共同目标",
      misunderstandingRisk: "可能先回应语气",
      adjustments: []
    }
  });

  await waitFor(() =>
    expect(screen.getByRole("button", { name: "识别意图" })).toBeEnabled()
  );
  expect(screen.queryByText("旧请求生成的翻译")).not.toBeInTheDocument();
});
