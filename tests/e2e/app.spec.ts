import { expect, test } from "@playwright/test";

test("completes the mock translation workflow on desktop", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("发送者 A").selectOption("ENFP");
  await page.getByLabel("接收者 B").selectOption("ISTJ");
  await page.getByLabel("使用场景").selectOption("work");
  await page.getByLabel("原话").fill("你这个方案风险太高了，我们不能继续这样做。");

  await page.getByRole("button", { name: "识别意图" }).click();
  await expect(page.getByText("选择翻译必须保留的意图")).toBeVisible();
  await expect(page.getByLabel("第 1 个意图内容")).toBeVisible();
  await expect(page.getByText("03 补充上下文")).toHaveCount(0);
  await expect(page.getByText("表达强度确认")).toHaveCount(0);

  const confirmIntent = page.getByRole("button", { name: "确认意图" });
  if ((await confirmIntent.count()) > 0) {
    await confirmIntent.click();
  }
  await page.getByRole("button", { name: "生成翻译" }).click();
  await expect(page.getByText("可以复制发送的版本")).toBeVisible();
  await expect(page.getByText("MBTI 翻译说明")).toBeVisible();
});

test("keeps the core workflow usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "MBTI 对话翻译器" })).toBeVisible();
  await expect(page.getByLabel("原话")).toBeVisible();
});
