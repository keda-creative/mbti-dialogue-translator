import { getCommunicationProfile, summarizeDirection } from "./profiles";

test("returns communication preferences for a type", () => {
  const profile = getCommunicationProfile("INTJ");
  expect(profile.informationOrder).toContain("先结论");
  expect(profile.evidenceStyle).toContain("原理逻辑");
});

test("summarizes an A to B direction gently", () => {
  const summary = summarizeDirection("ENFP", "ISTJ");
  expect(summary).toContain("ENFP");
  expect(summary).toContain("ISTJ");
  expect(summary).toContain("可能");
  expect(summary).not.toContain("一定");
});
