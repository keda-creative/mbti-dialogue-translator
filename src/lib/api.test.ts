import { requestIntentCards } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("throws a readable error for failed API responses", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: "意图识别失败" })
    })
  );

  await expect(
    requestIntentCards({
      config: { senderType: "ENFP", receiverType: "ISTJ", scenario: "work" },
      originalMessage: "这个方案风险太高。"
    })
  ).rejects.toThrow("意图识别失败");
});

test("throws the default error when a failed API response is not JSON", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      json: async () => {
        throw new SyntaxError("Unexpected token < in JSON");
      }
    })
  );

  await expect(
    requestIntentCards({
      config: { senderType: "ENFP", receiverType: "ISTJ", scenario: "work" },
      originalMessage: "这个方案风险太高。"
    })
  ).rejects.toThrow("请求失败，请稍后重试。");
});

test("throws a readable error when a successful API response has an invalid shape", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ intentCards: [], clarifyingQuestions: [] })
    })
  );

  await expect(
    requestIntentCards({
      config: { senderType: "ENFP", receiverType: "ISTJ", scenario: "work" },
      originalMessage: "这个方案风险太高。"
    })
  ).rejects.toThrow("服务返回格式不完整，请稍后重试。");
});
