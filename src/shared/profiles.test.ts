import { MBTI_TYPES } from "./domain";
import { getCommunicationProfile, summarizeDirection } from "./profiles";

test("returns communication preferences for a type", () => {
  const profile = getCommunicationProfile("INTJ");
  expect(profile.informationOrder).toContain("先结论");
  expect(profile.evidenceStyle).toContain("原理逻辑");
});

test("returns a complete communication profile for every type", () => {
  for (const type of MBTI_TYPES) {
    const profile = getCommunicationProfile(type);

    expect(profile.informationOrder.trim()).not.toBe("");
    expect(profile.evidenceStyle.trim()).not.toBe("");
    expect(profile.tone.trim()).not.toBe("");
    expect(profile.decisionStyle.trim()).not.toBe("");
    expect(profile.relationshipSignal.trim()).not.toBe("");
    expect(profile.density.trim()).not.toBe("");
  }
});

test("returns a copy so local mutation does not affect the next lookup", () => {
  const profile = getCommunicationProfile("INTJ") as { informationOrder: string };
  profile.informationOrder = "changed";

  expect(getCommunicationProfile("INTJ").informationOrder).toContain("先结论");
});

test("summarizes an A to B direction gently", () => {
  const summary = summarizeDirection("ENFP", "ISTJ");
  expect(summary).toContain("ENFP");
  expect(summary).toContain("ISTJ");
  expect(summary).toContain("可能");
  expect(summary).not.toContain("一定");
});
