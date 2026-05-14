import { requestIntentCards } from "./api";

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

  vi.unstubAllGlobals();
});
