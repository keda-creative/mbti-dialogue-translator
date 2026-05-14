# MBTI Dialogue Translator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first-version MBTI dialogue translator as a single-page web prototype with intent cards, confirmation gates, gentle MBTI explanations, and copy-ready translated output.

**Architecture:** Use a Vite React TypeScript client for the guided workflow and a small local Express API for AI calls. Shared TypeScript domain types keep frontend state, API contracts, and server validation aligned. The API uses OpenAI Responses API Structured Outputs when `OPENAI_API_KEY` is present and a deterministic mock fallback when it is absent.

**Tech Stack:** React, TypeScript, Vite, Vitest, React Testing Library, Express, Zod, OpenAI Node SDK, lucide-react, Playwright.

---

## References

- Design spec: `docs/superpowers/specs/2026-05-14-mbti-dialogue-translator-design.md`
- OpenAI Responses API: https://platform.openai.com/docs/api-reference/responses
- OpenAI Structured Outputs: https://platform.openai.com/docs/guides/structured-outputs
- OpenAI model reference: https://platform.openai.com/docs/models

## File Structure

- Create `package.json`: scripts, dependencies, and project metadata.
- Create `index.html`: Vite app entry.
- Create `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`: TypeScript, Vite, unit test, and browser test configuration.
- Create `src/test/setup.ts`: test environment setup.
- Create `src/main.tsx`: React mount entry.
- Create `src/App.tsx`: page composition and workflow orchestration.
- Create `src/styles.css`: responsive product UI styling.
- Create `src/shared/domain.ts`: MBTI, scenario, intent, strategy, and result types.
- Create `src/shared/profiles.ts`: MBTI communication preference presets and helper functions.
- Create `src/shared/contracts.ts`: Zod request and response contracts shared by client and server.
- Create `src/state/workflow.ts`: reducer, validation selectors, and workflow actions.
- Create `src/lib/api.ts`: typed frontend API client.
- Create `src/components/ConfigBar.tsx`: sender, receiver, and scenario controls.
- Create `src/components/OriginalMessage.tsx`: original-message input step.
- Create `src/components/IntentCards.tsx`: card editing, deletion, primary and sensitivity markers.
- Create `src/components/ClarifyingQuestions.tsx`: short clarification answers.
- Create `src/components/StrengthGate.tsx`: user approval for softening strong expression signals.
- Create `src/components/TranslationResult.tsx`: final message, explanation, intent preservation, adjustment notes, copy action.
- Create `src/components/StrategyPanel.tsx`: desktop side panel and mobile inline panel summary.
- Create `server/index.ts`: Express server and API routes.
- Create `server/openai.ts`: OpenAI Responses API wrapper.
- Create `server/prompts.ts`: system and user prompt builders.
- Create `server/mockAi.ts`: deterministic fallback generator.
- Create `tests/e2e/app.spec.ts`: browser-level happy-path verification.

## Task 1: Project Scaffold and Test Harness

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Test: `src/App.test.tsx`

- [ ] **Step 1: Create package and config files**

Create `package.json`:

```json
{
  "name": "mbti-dialogue-translator",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "concurrently \"npm:dev:api\" \"npm:dev:web\"",
    "dev:web": "vite --host 0.0.0.0",
    "dev:api": "tsx watch server/index.ts",
    "build": "tsc -p tsconfig.json && vite build",
    "preview": "vite preview --host 0.0.0.0",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "lint": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "concurrently": "latest",
    "cors": "latest",
    "express": "latest",
    "lucide-react": "latest",
    "openai": "latest",
    "react": "latest",
    "react-dom": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "@playwright/test": "latest",
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@testing-library/user-event": "latest",
    "@types/cors": "latest",
    "@types/express": "latest",
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "jsdom": "latest",
    "tsx": "latest",
    "typescript": "latest",
    "vite": "latest",
    "vitest": "latest"
  }
}
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "server", "tests", "vite.config.ts", "vitest.config.ts", "playwright.config.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts", "vitest.config.ts", "playwright.config.ts"]
}
```

Create `vite.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8787"
    }
  }
});
```

Create `vitest.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test/setup.ts"]
  }
});
```

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
    timeout: 120000
  },
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry"
  },
  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 13"] } }
  ]
});
```

Create `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MBTI 对话翻译器</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Create minimal React entry and smoke test**

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

Create `src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

Create `src/App.tsx`:

```tsx
export default function App() {
  return (
    <main className="app-shell">
      <section className="hero-strip">
        <p className="eyebrow">先保真，再翻译</p>
        <h1>MBTI 对话翻译器</h1>
        <p className="intro">把同一个意图，换成对方更容易接收的信息入口。</p>
      </section>
    </main>
  );
}
```

Create `src/styles.css`:

```css
:root {
  color: #18201b;
  background: #f6f4ee;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

button,
input,
select,
textarea {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
  padding: 32px;
}

.hero-strip {
  max-width: 1120px;
  margin: 0 auto;
}

.eyebrow {
  margin: 0 0 8px;
  color: #5c6b60;
  font-size: 0.9rem;
}

h1 {
  margin: 0;
  font-size: 2rem;
  letter-spacing: 0;
}

.intro {
  max-width: 560px;
  color: #59645d;
  line-height: 1.7;
}
```

Create `src/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders product title", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "MBTI 对话翻译器" })).toBeInTheDocument();
});
```

- [ ] **Step 3: Install dependencies**

Run:

```bash
npm install
```

Expected: `package-lock.json` is created and dependency installation exits with code 0.

- [ ] **Step 4: Run the smoke test**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: one passing test named `renders product title`.

- [ ] **Step 5: Commit scaffold**

Run:

```bash
git add package.json package-lock.json index.html tsconfig.json tsconfig.node.json vite.config.ts vitest.config.ts playwright.config.ts src
git commit -m "feat: scaffold translator app"
```

Expected: commit succeeds and `git status --short` has no scaffold files left unstaged.

## Task 2: Shared Domain Model and MBTI Profiles

**Files:**
- Create: `src/shared/domain.ts`
- Create: `src/shared/profiles.ts`
- Test: `src/shared/domain.test.ts`
- Test: `src/shared/profiles.test.ts`

- [ ] **Step 1: Write domain tests**

Create `src/shared/domain.test.ts`:

```ts
import { INTENT_TYPES, MBTI_TYPES, SCENARIOS } from "./domain";

test("defines all 16 MBTI types", () => {
  expect(MBTI_TYPES).toHaveLength(16);
  expect(MBTI_TYPES).toContain("INTJ");
  expect(MBTI_TYPES).toContain("ENFP");
});

test("defines the fixed first-version scenarios", () => {
  expect(SCENARIOS.map((scenario) => scenario.id)).toEqual([
    "work",
    "romantic",
    "friends_family",
    "general"
  ]);
});

test("defines six intent card types", () => {
  expect(INTENT_TYPES.map((intent) => intent.id)).toEqual([
    "information",
    "action",
    "outcome",
    "relationship",
    "emotion",
    "reverse"
  ]);
});
```

Create `src/shared/profiles.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
npm test -- src/shared/domain.test.ts src/shared/profiles.test.ts
```

Expected: tests fail because `src/shared/domain.ts` and `src/shared/profiles.ts` do not exist.

- [ ] **Step 3: Create shared domain types**

Create `src/shared/domain.ts`:

```ts
export const MBTI_TYPES = [
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP"
] as const;

export type MbtiType = (typeof MBTI_TYPES)[number];

export const SCENARIOS = [
  { id: "work", label: "工作协作" },
  { id: "romantic", label: "亲密关系" },
  { id: "friends_family", label: "朋友家人" },
  { id: "general", label: "通用" }
] as const;

export type ScenarioId = (typeof SCENARIOS)[number]["id"];

export const INTENT_TYPES = [
  { id: "information", label: "信息意图", helper: "我想让对方知道什么事实、背景或判断。" },
  { id: "action", label: "行动意图", helper: "我希望对方接下来做什么或停止做什么。" },
  { id: "outcome", label: "结果意图", helper: "我希望沟通之后达成什么状态。" },
  { id: "relationship", label: "关系意图", helper: "我希望对方如何理解我和 TA 的关系。" },
  { id: "emotion", label: "情绪意图", helper: "我希望自己的情绪被怎样理解。" },
  { id: "reverse", label: "反向意图", helper: "我最不希望对方误会成什么。" }
] as const;

export type IntentType = (typeof INTENT_TYPES)[number]["id"];

export type IntentMarker = "primary" | "sensitive" | "softenable";

export interface IntentCard {
  id: string;
  type: IntentType;
  content: string;
  confidence: "low" | "medium" | "high";
  markers: IntentMarker[];
}

export interface TranslatorConfig {
  senderType: MbtiType;
  receiverType: MbtiType;
  scenario: ScenarioId;
}

export interface ClarifyingQuestion {
  id: string;
  question: string;
  reason: string;
}

export interface ExpressionAdjustment {
  signal: "blame" | "anxiety" | "sarcasm" | "control" | "intensity";
  originalSignal: string;
  suggestedChange: string;
  requiresApproval: boolean;
}

export interface TranslationStrategy {
  informationOrder: string;
  tone: string;
  evidenceStyle: string;
  relationshipSignal: string;
  misunderstandingRisk: string;
  adjustments: ExpressionAdjustment[];
}

export interface TranslationResult {
  translatedMessage: string;
  mbtiExplanation: string;
  preservedIntents: string[];
  adjustedExpressions: string[];
  strategy: TranslationStrategy;
}
```

- [ ] **Step 4: Create MBTI profile helpers**

Create `src/shared/profiles.ts`:

```ts
import type { MbtiType } from "./domain";

export interface CommunicationProfile {
  informationOrder: string;
  evidenceStyle: string;
  tone: string;
  decisionStyle: string;
  relationshipSignal: string;
  density: string;
}

const baseProfiles: Record<MbtiType, CommunicationProfile> = {
  INTJ: {
    informationOrder: "先结论，再给判断依据",
    evidenceStyle: "原理逻辑、系统风险、长期影响",
    tone: "直接、克制、少情绪判断",
    decisionStyle: "明确建议和判断标准",
    relationshipSignal: "尊重自主判断空间",
    density: "高密度简洁"
  },
  INTP: {
    informationOrder: "先问题框架，再给可能性",
    evidenceStyle: "原理逻辑、假设边界、反例",
    tone: "开放、精确、低压",
    decisionStyle: "多个可讨论选项",
    relationshipSignal: "保留探索空间",
    density: "解释充分但不催促"
  },
  ENTJ: {
    informationOrder: "先目标和决策点，再给行动建议",
    evidenceStyle: "结果、效率、风险收益",
    tone: "直接、有推进感",
    decisionStyle: "明确建议和优先级",
    relationshipSignal: "强调共同目标",
    density: "高密度、行动导向"
  },
  ENTP: {
    informationOrder: "先可能性和问题张力，再给选择",
    evidenceStyle: "反例、机会、概念连接",
    tone: "开放、有弹性",
    decisionStyle: "多个选项和讨论空间",
    relationshipSignal: "尊重对方的思辨空间",
    density: "轻快但有信息量"
  },
  INFJ: {
    informationOrder: "先关系和意义，再给具体问题",
    evidenceStyle: "长期影响、价值一致性、人的感受",
    tone: "温和、真诚、带边界",
    decisionStyle: "共同理解后的建议",
    relationshipSignal: "表达理解和善意",
    density: "解释充分"
  },
  INFP: {
    informationOrder: "先感受和价值，再给请求",
    evidenceStyle: "个人意义、感受影响、真诚动机",
    tone: "柔和、尊重、不压迫",
    decisionStyle: "保留选择空间",
    relationshipSignal: "保护对方感受和自我表达",
    density: "温和展开"
  },
  ENFJ: {
    informationOrder: "先共同目标和关系，再给行动",
    evidenceStyle: "团队影响、情绪氛围、共同收益",
    tone: "鼓励、清晰、有关照",
    decisionStyle: "协商式建议",
    relationshipSignal: "明确认可和共同感",
    density: "结构清楚但有人情味"
  },
  ENFP: {
    informationOrder: "先可能性和动机，再给重点",
    evidenceStyle: "愿景、体验、联想和人的影响",
    tone: "热情、灵活、开放",
    decisionStyle: "选择空间和灵感启发",
    relationshipSignal: "表达善意和连接感",
    density: "轻松口语"
  },
  ISTJ: {
    informationOrder: "先事实和责任边界，再给结论",
    evidenceStyle: "事实、流程、已有约定",
    tone: "具体、稳定、少夸张",
    decisionStyle: "明确步骤和交付标准",
    relationshipSignal: "尊重规则和承诺",
    density: "分步骤"
  },
  ISFJ: {
    informationOrder: "先关系和已有承诺，再给请求",
    evidenceStyle: "具体经验、实际影响、责任感",
    tone: "温和、体贴、清楚",
    decisionStyle: "可执行的小步骤",
    relationshipSignal: "表达感谢和照顾",
    density: "具体但不压迫"
  },
  ESTJ: {
    informationOrder: "先目标、规则和责任，再给行动",
    evidenceStyle: "事实、效率、标准",
    tone: "直接、明确、有秩序",
    decisionStyle: "明确分工和期限",
    relationshipSignal: "强调可靠和负责",
    density: "简洁有条理"
  },
  ESFJ: {
    informationOrder: "先关系氛围和共同期待，再给请求",
    evidenceStyle: "对人的影响、具体责任、群体协调",
    tone: "友好、清楚、带认可",
    decisionStyle: "协作式步骤",
    relationshipSignal: "表达感谢、认可和共同体感",
    density: "清楚具体"
  },
  ISTP: {
    informationOrder: "先问题本身，再给可操作信息",
    evidenceStyle: "事实、机制、实际可行性",
    tone: "简短、冷静、不绕",
    decisionStyle: "可选方案和动手空间",
    relationshipSignal: "减少情绪压力",
    density: "低冗余"
  },
  ISFP: {
    informationOrder: "先感受和具体处境，再给请求",
    evidenceStyle: "个人体验、当下影响、具体例子",
    tone: "柔和、尊重、不评价",
    decisionStyle: "低压选择",
    relationshipSignal: "保护自主和感受",
    density: "自然口语"
  },
  ESTP: {
    informationOrder: "先当前问题和机会，再给动作",
    evidenceStyle: "即时结果、现实反馈、具体例子",
    tone: "直接、轻快、少抽象",
    decisionStyle: "马上能试的选项",
    relationshipSignal: "保持空间和灵活度",
    density: "短句、高行动性"
  },
  ESFP: {
    informationOrder: "先人和当下感受，再给具体事",
    evidenceStyle: "真实体验、现场影响、例子",
    tone: "友好、鲜活、少压迫",
    decisionStyle: "轻松可选的行动",
    relationshipSignal: "表达喜欢、认可和在意",
    density: "轻松口语"
  }
};

export function getCommunicationProfile(type: MbtiType): CommunicationProfile {
  return baseProfiles[type];
}

export function summarizeDirection(senderType: MbtiType, receiverType: MbtiType): string {
  const sender = getCommunicationProfile(senderType);
  const receiver = getCommunicationProfile(receiverType);

  return `${senderType} 的表达可能更自然地偏向「${sender.informationOrder}」和「${sender.tone}」；${receiverType} 可能更容易接收「${receiver.informationOrder}」与「${receiver.evidenceStyle}」的组织方式。`;
}
```

- [ ] **Step 5: Run domain tests**

Run:

```bash
npm test -- src/shared/domain.test.ts src/shared/profiles.test.ts
```

Expected: all tests pass.

- [ ] **Step 6: Commit domain model**

Run:

```bash
git add src/shared
git commit -m "feat: add MBTI domain model"
```

Expected: commit succeeds.

## Task 3: Workflow Reducer and Validation Gates

**Files:**
- Create: `src/state/workflow.ts`
- Test: `src/state/workflow.test.ts`

- [ ] **Step 1: Write reducer tests**

Create `src/state/workflow.test.ts`:

```ts
import { initialWorkflowState, reducer, selectCanAnalyze, selectCanTranslate } from "./workflow";

test("requires original message before intent analysis", () => {
  expect(selectCanAnalyze(initialWorkflowState)).toBe(false);
  const state = reducer(initialWorkflowState, {
    type: "setOriginalMessage",
    value: "你这个方案风险太高了，我们不能继续这样做。"
  });
  expect(selectCanAnalyze(state)).toBe(true);
});

test("requires a primary intent before translation", () => {
  const withCards = reducer(initialWorkflowState, {
    type: "setIntentCards",
    cards: [
      {
        id: "intent-1",
        type: "information",
        content: "我想提醒方案风险。",
        confidence: "high",
        markers: []
      }
    ],
    questions: []
  });

  expect(selectCanTranslate(withCards)).toBe(false);

  const withPrimary = reducer(withCards, {
    type: "toggleMarker",
    id: "intent-1",
    marker: "primary"
  });

  expect(selectCanTranslate(withPrimary)).toBe(true);
});

test("keeps only one primary intent", () => {
  const state = reducer(initialWorkflowState, {
    type: "setIntentCards",
    cards: [
      { id: "one", type: "information", content: "传递事实", confidence: "high", markers: ["primary"] },
      { id: "two", type: "action", content: "请求行动", confidence: "medium", markers: [] }
    ],
    questions: []
  });

  const next = reducer(state, { type: "toggleMarker", id: "two", marker: "primary" });

  expect(next.intentCards.find((card) => card.id === "one")?.markers).not.toContain("primary");
  expect(next.intentCards.find((card) => card.id === "two")?.markers).toContain("primary");
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
npm test -- src/state/workflow.test.ts
```

Expected: tests fail because `src/state/workflow.ts` does not exist.

- [ ] **Step 3: Implement workflow reducer**

Create `src/state/workflow.ts`:

```ts
import type {
  ClarifyingQuestion,
  IntentCard,
  IntentMarker,
  TranslationResult,
  TranslatorConfig
} from "../shared/domain";

export interface WorkflowState {
  config: TranslatorConfig;
  originalMessage: string;
  intentCards: IntentCard[];
  clarifyingQuestions: ClarifyingQuestion[];
  clarificationAnswers: Record<string, string>;
  strengthApproved: boolean;
  isLoading: boolean;
  error: string | null;
  result: TranslationResult | null;
}

export const initialWorkflowState: WorkflowState = {
  config: {
    senderType: "ENFP",
    receiverType: "ISTJ",
    scenario: "work"
  },
  originalMessage: "",
  intentCards: [],
  clarifyingQuestions: [],
  clarificationAnswers: {},
  strengthApproved: false,
  isLoading: false,
  error: null,
  result: null
};

export type WorkflowAction =
  | { type: "setConfig"; config: TranslatorConfig }
  | { type: "setOriginalMessage"; value: string }
  | { type: "setIntentCards"; cards: IntentCard[]; questions: ClarifyingQuestion[] }
  | { type: "updateIntentContent"; id: string; content: string }
  | { type: "deleteIntent"; id: string }
  | { type: "toggleMarker"; id: string; marker: IntentMarker }
  | { type: "setClarificationAnswer"; id: string; value: string }
  | { type: "setStrengthApproved"; value: boolean }
  | { type: "setLoading"; value: boolean }
  | { type: "setError"; value: string | null }
  | { type: "setResult"; result: TranslationResult | null };

export function reducer(state: WorkflowState, action: WorkflowAction): WorkflowState {
  switch (action.type) {
    case "setConfig":
      return { ...state, config: action.config, result: null };
    case "setOriginalMessage":
      return { ...state, originalMessage: action.value, result: null };
    case "setIntentCards":
      return {
        ...state,
        intentCards: action.cards,
        clarifyingQuestions: action.questions,
        clarificationAnswers: {},
        strengthApproved: false,
        result: null
      };
    case "updateIntentContent":
      return {
        ...state,
        intentCards: state.intentCards.map((card) =>
          card.id === action.id ? { ...card, content: action.content } : card
        ),
        result: null
      };
    case "deleteIntent":
      return {
        ...state,
        intentCards: state.intentCards.filter((card) => card.id !== action.id),
        result: null
      };
    case "toggleMarker":
      return {
        ...state,
        intentCards: state.intentCards.map((card) => {
          const withoutPrimary =
            action.marker === "primary" ? card.markers.filter((marker) => marker !== "primary") : card.markers;
          if (card.id !== action.id) {
            return { ...card, markers: withoutPrimary };
          }
          const markers = withoutPrimary.includes(action.marker)
            ? withoutPrimary.filter((marker) => marker !== action.marker)
            : [...withoutPrimary, action.marker];
          return { ...card, markers };
        }),
        result: null
      };
    case "setClarificationAnswer":
      return {
        ...state,
        clarificationAnswers: { ...state.clarificationAnswers, [action.id]: action.value },
        result: null
      };
    case "setStrengthApproved":
      return { ...state, strengthApproved: action.value, result: null };
    case "setLoading":
      return { ...state, isLoading: action.value };
    case "setError":
      return { ...state, error: action.value };
    case "setResult":
      return { ...state, result: action.result };
    default:
      return state;
  }
}

export function selectCanAnalyze(state: WorkflowState): boolean {
  return state.originalMessage.trim().length >= 6;
}

export function selectPrimaryIntent(state: WorkflowState): IntentCard | undefined {
  return state.intentCards.find((card) => card.markers.includes("primary"));
}

export function selectCanTranslate(state: WorkflowState): boolean {
  return Boolean(selectPrimaryIntent(state)) && state.intentCards.length > 0;
}
```

- [ ] **Step 4: Run reducer tests**

Run:

```bash
npm test -- src/state/workflow.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit workflow state**

Run:

```bash
git add src/state
git commit -m "feat: add workflow state gates"
```

Expected: commit succeeds.

## Task 4: API Contracts and Mock AI

**Files:**
- Create: `src/shared/contracts.ts`
- Create: `server/mockAi.ts`
- Test: `src/shared/contracts.test.ts`
- Test: `server/mockAi.test.ts`

- [ ] **Step 1: Write contract and mock tests**

Create `src/shared/contracts.test.ts`:

```ts
import { analyzeIntentResponseSchema, translationResponseSchema } from "./contracts";

test("validates an intent analysis response", () => {
  const parsed = analyzeIntentResponseSchema.parse({
    intentCards: [
      {
        id: "intent-1",
        type: "information",
        content: "我想提醒方案风险。",
        confidence: "high",
        markers: []
      }
    ],
    clarifyingQuestions: [],
    safetyRedirect: null
  });

  expect(parsed.intentCards[0].type).toBe("information");
});

test("validates a translation response", () => {
  const parsed = translationResponseSchema.parse({
    translatedMessage: "我担心这个方案当前的风险偏高，建议我们先复盘关键假设。",
    mbtiExplanation: "考虑到 B 是 ISTJ，可能更容易接收事实和步骤清晰的表达。",
    preservedIntents: ["提醒方案风险"],
    adjustedExpressions: ["降低了责备感"],
    strategy: {
      informationOrder: "先事实，再建议",
      tone: "克制直接",
      evidenceStyle: "事实和流程",
      relationshipSignal: "共同目标",
      misunderstandingRisk: "对方可能先听成否定能力",
      adjustments: []
    }
  });

  expect(parsed.adjustedExpressions).toContain("降低了责备感");
});
```

Create `server/mockAi.test.ts`:

```ts
import { mockAnalyzeIntents, mockGenerateTranslation } from "./mockAi";

test("mock analysis returns intent cards and questions", () => {
  const response = mockAnalyzeIntents({
    config: { senderType: "ENFP", receiverType: "ISTJ", scenario: "work" },
    originalMessage: "你这个方案风险太高了，我们不能继续这样做。"
  });

  expect(response.intentCards.length).toBeGreaterThanOrEqual(3);
  expect(response.intentCards.some((card) => card.type === "information")).toBe(true);
});

test("mock translation keeps the primary intent", () => {
  const response = mockGenerateTranslation({
    config: { senderType: "ENFP", receiverType: "ISTJ", scenario: "work" },
    originalMessage: "你这个方案风险太高了，我们不能继续这样做。",
    intentCards: [
      {
        id: "intent-1",
        type: "information",
        content: "我想提醒方案风险。",
        confidence: "high",
        markers: ["primary"]
      }
    ],
    clarificationAnswers: {},
    strengthApproved: true
  });

  expect(response.preservedIntents).toContain("我想提醒方案风险。");
  expect(response.mbtiExplanation).toContain("ISTJ");
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
npm test -- src/shared/contracts.test.ts server/mockAi.test.ts
```

Expected: tests fail because contract and mock files do not exist.

- [ ] **Step 3: Create API contracts**

Create `src/shared/contracts.ts`:

```ts
import { z } from "zod";
import { INTENT_TYPES, MBTI_TYPES, SCENARIOS } from "./domain";

const mbtiSchema = z.enum(MBTI_TYPES);
const scenarioSchema = z.enum(SCENARIOS.map((scenario) => scenario.id) as [string, ...string[]]);
const intentTypeSchema = z.enum(INTENT_TYPES.map((intent) => intent.id) as [string, ...string[]]);
const intentMarkerSchema = z.enum(["primary", "sensitive", "softenable"]);

export const translatorConfigSchema = z.object({
  senderType: mbtiSchema,
  receiverType: mbtiSchema,
  scenario: scenarioSchema
});

export const intentCardSchema = z.object({
  id: z.string().min(1),
  type: intentTypeSchema,
  content: z.string().min(1),
  confidence: z.enum(["low", "medium", "high"]),
  markers: z.array(intentMarkerSchema)
});

export const clarifyingQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  reason: z.string().min(1)
});

export const analyzeIntentRequestSchema = z.object({
  config: translatorConfigSchema,
  originalMessage: z.string().min(6)
});

export const analyzeIntentResponseSchema = z.object({
  intentCards: z.array(intentCardSchema).min(1).max(6),
  clarifyingQuestions: z.array(clarifyingQuestionSchema).max(3),
  safetyRedirect: z.string().nullable()
});

export const translationRequestSchema = z.object({
  config: translatorConfigSchema,
  originalMessage: z.string().min(6),
  intentCards: z.array(intentCardSchema).min(1),
  clarificationAnswers: z.record(z.string(), z.string()),
  strengthApproved: z.boolean()
});

export const translationResponseSchema = z.object({
  translatedMessage: z.string().min(1),
  mbtiExplanation: z.string().min(1),
  preservedIntents: z.array(z.string()).min(1),
  adjustedExpressions: z.array(z.string()),
  strategy: z.object({
    informationOrder: z.string().min(1),
    tone: z.string().min(1),
    evidenceStyle: z.string().min(1),
    relationshipSignal: z.string().min(1),
    misunderstandingRisk: z.string().min(1),
    adjustments: z.array(
      z.object({
        signal: z.enum(["blame", "anxiety", "sarcasm", "control", "intensity"]),
        originalSignal: z.string().min(1),
        suggestedChange: z.string().min(1),
        requiresApproval: z.boolean()
      })
    )
  })
});

export type AnalyzeIntentRequest = z.infer<typeof analyzeIntentRequestSchema>;
export type AnalyzeIntentResponse = z.infer<typeof analyzeIntentResponseSchema>;
export type TranslationRequest = z.infer<typeof translationRequestSchema>;
export type TranslationResponse = z.infer<typeof translationResponseSchema>;
```

- [ ] **Step 4: Create deterministic mock AI**

Create `server/mockAi.ts`:

```ts
import type { AnalyzeIntentRequest, AnalyzeIntentResponse, TranslationRequest, TranslationResponse } from "../src/shared/contracts";
import { getCommunicationProfile, summarizeDirection } from "../src/shared/profiles";

export function mockAnalyzeIntents(request: AnalyzeIntentRequest): AnalyzeIntentResponse {
  const { originalMessage } = request;
  const hasStrongSignal = /太|不能|总是|从来|离谱|烦|失望|为什么/.test(originalMessage);

  return {
    intentCards: [
      {
        id: "intent-information",
        type: "information",
        content: "我想让对方知道当前表达里存在我在意的风险或问题。",
        confidence: "high",
        markers: ["primary"]
      },
      {
        id: "intent-action",
        type: "action",
        content: "我希望对方愿意一起重新看一下下一步怎么处理。",
        confidence: "medium",
        markers: []
      },
      {
        id: "intent-relationship",
        type: "relationship",
        content: "我不想让对方把这理解成我在否定 TA 本人。",
        confidence: "medium",
        markers: ["sensitive"]
      },
      {
        id: "intent-emotion",
        type: "emotion",
        content: hasStrongSignal ? "我有明显着急或不满，但核心不是攻击对方。" : "我希望自己的在意被看见。",
        confidence: "medium",
        markers: hasStrongSignal ? ["softenable"] : []
      }
    ],
    clarifyingQuestions: hasStrongSignal
      ? [
          {
            id: "question-1",
            question: "你更希望对方先理解风险本身，还是先理解你的情绪压力？",
            reason: "原话里同时有事情推进和情绪表达，确认优先级能减少误译。"
          }
        ]
      : [],
    safetyRedirect: null
  };
}

export function mockGenerateTranslation(request: TranslationRequest): TranslationResponse {
  const receiver = getCommunicationProfile(request.config.receiverType);
  const primaryIntent =
    request.intentCards.find((card) => card.markers.includes("primary"))?.content || request.intentCards[0].content;
  const sensitiveIntents = request.intentCards
    .filter((card) => card.markers.includes("sensitive"))
    .map((card) => card.content);

  return {
    translatedMessage: `我想先把重点说清楚：${primaryIntent}。基于目前的信息，我建议我们一起确认关键风险、影响范围和下一步动作，这样可以避免后面投入更多成本。`,
    mbtiExplanation: `${summarizeDirection(request.config.senderType, request.config.receiverType)}这次翻译参考了 ${request.config.receiverType} 可能更容易接收的「${receiver.informationOrder}」和「${receiver.evidenceStyle}」。`,
    preservedIntents: [primaryIntent, ...sensitiveIntents],
    adjustedExpressions: request.strengthApproved
      ? ["把原话里可能被听成责备的部分，调整成风险说明和共同处理建议。"]
      : ["保留了较直接的表达强度，只调整了信息顺序。"],
    strategy: {
      informationOrder: receiver.informationOrder,
      tone: receiver.tone,
      evidenceStyle: receiver.evidenceStyle,
      relationshipSignal: receiver.relationshipSignal,
      misunderstandingRisk: "对方可能先回应语气，而不是先处理你真正想传达的问题。",
      adjustments: [
        {
          signal: "blame",
          originalSignal: "原话可能被接收成对人的否定。",
          suggestedChange: "改成对风险和下一步动作的描述。",
          requiresApproval: true
        }
      ]
    }
  };
}
```

- [ ] **Step 5: Run contract and mock tests**

Run:

```bash
npm test -- src/shared/contracts.test.ts server/mockAi.test.ts
```

Expected: all tests pass.

- [ ] **Step 6: Commit contracts and mock AI**

Run:

```bash
git add src/shared/contracts.ts src/shared/contracts.test.ts server/mockAi.ts server/mockAi.test.ts
git commit -m "feat: add AI contracts and mock responses"
```

Expected: commit succeeds.

## Task 5: Express API and OpenAI Structured Outputs

**Files:**
- Create: `server/prompts.ts`
- Create: `server/openai.ts`
- Create: `server/index.ts`
- Test: `server/openai.test.ts`

- [ ] **Step 1: Write OpenAI wrapper tests**

Create `server/openai.test.ts`:

```ts
import { shouldUseMockAi } from "./openai";

test("uses mock AI when no API key is configured", () => {
  expect(shouldUseMockAi({ OPENAI_API_KEY: undefined })).toBe(true);
});

test("uses OpenAI when an API key is configured", () => {
  expect(shouldUseMockAi({ OPENAI_API_KEY: "sk-test" })).toBe(false);
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
npm test -- server/openai.test.ts
```

Expected: tests fail because `server/openai.ts` does not exist.

- [ ] **Step 3: Create prompts**

Create `server/prompts.ts`:

```ts
import type { AnalyzeIntentRequest, TranslationRequest } from "../src/shared/contracts";
import { SCENARIOS } from "../src/shared/domain";
import { getCommunicationProfile, summarizeDirection } from "../src/shared/profiles";

function scenarioLabel(id: string): string {
  return SCENARIOS.find((scenario) => scenario.id === id)?.label || "通用";
}

export function buildIntentPrompt(request: AnalyzeIntentRequest): string {
  const direction = summarizeDirection(request.config.senderType, request.config.receiverType);

  return [
    "你是一个 MBTI 对话翻译器的意图识别模块。",
    "任务：只识别多重意图，不生成最终改写。",
    "必须输出 3 到 6 张意图卡，类型只能来自 information/action/outcome/relationship/emotion/reverse。",
    "不要做人格诊断，不要写某个 MBTI 一定怎样。",
    "如果发现操控、欺骗、胁迫目标，设置 safetyRedirect，并把意图转向真实需求和边界表达。",
    `发送者：${request.config.senderType}`,
    `接收者：${request.config.receiverType}`,
    `场景：${scenarioLabel(request.config.scenario)}`,
    `沟通方向摘要：${direction}`,
    `原话：${request.originalMessage}`
  ].join("\n");
}

export function buildTranslationPrompt(request: TranslationRequest): string {
  const receiver = getCommunicationProfile(request.config.receiverType);

  return [
    "你是一个 MBTI 对话翻译器的结果生成模块。",
    "任务：基于用户确认后的意图卡，生成可复制发送的改写表达和温和版 MBTI 翻译说明。",
    "必须保留 primary 意图和 sensitive 意图。",
    "如果 strengthApproved 为 false，不要弱化强表达信号，只能调整结构和清晰度。",
    "解释必须明确提到发送者和接收者 MBTI，但使用“可能”“倾向”“参考”等温和措辞。",
    "不要隐藏关键事实，不要优化操控、欺骗、胁迫或 PUA 式目标。",
    `发送者：${request.config.senderType}`,
    `接收者：${request.config.receiverType}`,
    `场景：${scenarioLabel(request.config.scenario)}`,
    `接收者偏好参考：${JSON.stringify(receiver)}`,
    `是否允许弱化强表达：${request.strengthApproved ? "是" : "否"}`,
    `原话：${request.originalMessage}`,
    `用户确认后的意图卡：${JSON.stringify(request.intentCards)}`,
    `澄清答案：${JSON.stringify(request.clarificationAnswers)}`
  ].join("\n");
}
```

- [ ] **Step 4: Create OpenAI wrapper with mock fallback**

Create `server/openai.ts`:

```ts
import OpenAI from "openai";
import {
  analyzeIntentResponseSchema,
  type AnalyzeIntentRequest,
  type AnalyzeIntentResponse,
  type TranslationRequest,
  type TranslationResponse,
  translationResponseSchema
} from "../src/shared/contracts";
import { mockAnalyzeIntents, mockGenerateTranslation } from "./mockAi";
import { buildIntentPrompt, buildTranslationPrompt } from "./prompts";

const intentJsonSchema = {
  name: "intent_analysis",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["intentCards", "clarifyingQuestions", "safetyRedirect"],
    properties: {
      intentCards: {
        type: "array",
        minItems: 1,
        maxItems: 6,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "type", "content", "confidence", "markers"],
          properties: {
            id: { type: "string" },
            type: { enum: ["information", "action", "outcome", "relationship", "emotion", "reverse"] },
            content: { type: "string" },
            confidence: { enum: ["low", "medium", "high"] },
            markers: {
              type: "array",
              items: { enum: ["primary", "sensitive", "softenable"] }
            }
          }
        }
      },
      clarifyingQuestions: {
        type: "array",
        maxItems: 3,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "question", "reason"],
          properties: {
            id: { type: "string" },
            question: { type: "string" },
            reason: { type: "string" }
          }
        }
      },
      safetyRedirect: { type: ["string", "null"] }
    }
  }
} as const;

const translationJsonSchema = {
  name: "translation_result",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["translatedMessage", "mbtiExplanation", "preservedIntents", "adjustedExpressions", "strategy"],
    properties: {
      translatedMessage: { type: "string" },
      mbtiExplanation: { type: "string" },
      preservedIntents: { type: "array", items: { type: "string" } },
      adjustedExpressions: { type: "array", items: { type: "string" } },
      strategy: {
        type: "object",
        additionalProperties: false,
        required: [
          "informationOrder",
          "tone",
          "evidenceStyle",
          "relationshipSignal",
          "misunderstandingRisk",
          "adjustments"
        ],
        properties: {
          informationOrder: { type: "string" },
          tone: { type: "string" },
          evidenceStyle: { type: "string" },
          relationshipSignal: { type: "string" },
          misunderstandingRisk: { type: "string" },
          adjustments: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["signal", "originalSignal", "suggestedChange", "requiresApproval"],
              properties: {
                signal: { enum: ["blame", "anxiety", "sarcasm", "control", "intensity"] },
                originalSignal: { type: "string" },
                suggestedChange: { type: "string" },
                requiresApproval: { type: "boolean" }
              }
            }
          }
        }
      }
    }
  }
} as const;

export function shouldUseMockAi(env: Pick<NodeJS.ProcessEnv, "OPENAI_API_KEY">): boolean {
  return !env.OPENAI_API_KEY;
}

function parseOutputText<T>(text: string, parser: { parse: (value: unknown) => T }): T {
  return parser.parse(JSON.parse(text));
}

export async function analyzeIntents(request: AnalyzeIntentRequest): Promise<AnalyzeIntentResponse> {
  if (shouldUseMockAi(process.env)) {
    return mockAnalyzeIntents(request);
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5-mini",
    input: buildIntentPrompt(request),
    text: {
      format: {
        type: "json_schema",
        ...intentJsonSchema
      }
    }
  });

  return parseOutputText(response.output_text, analyzeIntentResponseSchema);
}

export async function generateTranslation(request: TranslationRequest): Promise<TranslationResponse> {
  if (shouldUseMockAi(process.env)) {
    return mockGenerateTranslation(request);
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5-mini",
    input: buildTranslationPrompt(request),
    text: {
      format: {
        type: "json_schema",
        ...translationJsonSchema
      }
    }
  });

  return parseOutputText(response.output_text, translationResponseSchema);
}
```

- [ ] **Step 5: Create Express API server**

Create `server/index.ts`:

```ts
import cors from "cors";
import express from "express";
import { analyzeIntentRequestSchema, translationRequestSchema } from "../src/shared/contracts";
import { analyzeIntents, generateTranslation } from "./openai";

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.post("/api/intent-cards", async (request, response) => {
  const parsed = analyzeIntentRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "请求格式不完整，请检查 MBTI、场景和原话。", issues: parsed.error.issues });
    return;
  }

  try {
    response.json(await analyzeIntents(parsed.data));
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "意图识别失败，请稍后重试。" });
  }
});

app.post("/api/translation", async (request, response) => {
  const parsed = translationRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "翻译请求缺少已确认意图，请检查卡片标记。", issues: parsed.error.issues });
    return;
  }

  const hasPrimary = parsed.data.intentCards.some((card) => card.markers.includes("primary"));
  if (!hasPrimary) {
    response.status(400).json({ message: "请先标记一个主意图。" });
    return;
  }

  try {
    response.json(await generateTranslation(parsed.data));
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "翻译生成失败，请稍后重试。" });
  }
});

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
```

- [ ] **Step 6: Run API wrapper tests and typecheck**

Run:

```bash
npm test -- server/openai.test.ts
npm run lint
```

Expected: OpenAI wrapper tests pass and TypeScript exits with code 0.

- [ ] **Step 7: Commit API server**

Run:

```bash
git add server src/shared/contracts.ts
git commit -m "feat: add structured AI API"
```

Expected: commit succeeds.

## Task 6: Frontend API Client and Base Workflow UI

**Files:**
- Create: `src/lib/api.ts`
- Create: `src/components/ConfigBar.tsx`
- Create: `src/components/OriginalMessage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Test: `src/lib/api.test.ts`
- Test: `src/App.test.tsx`

- [ ] **Step 1: Write API client test**

Replace `src/App.test.tsx` with:

```tsx
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
```

Create `src/lib/api.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
npm test -- src/App.test.tsx src/lib/api.test.ts
```

Expected: tests fail because UI controls and API client are not implemented.

- [ ] **Step 3: Create typed API client**

Create `src/lib/api.ts`:

```ts
import {
  analyzeIntentResponseSchema,
  translationResponseSchema,
  type AnalyzeIntentRequest,
  type AnalyzeIntentResponse,
  type TranslationRequest,
  type TranslationResponse
} from "../shared/contracts";

async function postJson<T>(url: string, body: unknown, parse: (value: unknown) => T): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || "请求失败，请稍后重试。");
  }

  return parse(payload);
}

export function requestIntentCards(request: AnalyzeIntentRequest): Promise<AnalyzeIntentResponse> {
  return postJson("/api/intent-cards", request, (value) => analyzeIntentResponseSchema.parse(value));
}

export function requestTranslation(request: TranslationRequest): Promise<TranslationResponse> {
  return postJson("/api/translation", request, (value) => translationResponseSchema.parse(value));
}
```

- [ ] **Step 4: Create configuration and message components**

Create `src/components/ConfigBar.tsx`:

```tsx
import { MBTI_TYPES, SCENARIOS, type TranslatorConfig } from "../shared/domain";

interface ConfigBarProps {
  config: TranslatorConfig;
  onChange: (config: TranslatorConfig) => void;
}

export function ConfigBar({ config, onChange }: ConfigBarProps) {
  return (
    <section className="config-bar" aria-label="翻译配置">
      <label>
        <span>发送者 A</span>
        <select
          value={config.senderType}
          onChange={(event) => onChange({ ...config, senderType: event.target.value as TranslatorConfig["senderType"] })}
        >
          {MBTI_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>接收者 B</span>
        <select
          value={config.receiverType}
          onChange={(event) => onChange({ ...config, receiverType: event.target.value as TranslatorConfig["receiverType"] })}
        >
          {MBTI_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>使用场景</span>
        <select
          value={config.scenario}
          onChange={(event) => onChange({ ...config, scenario: event.target.value as TranslatorConfig["scenario"] })}
        >
          {SCENARIOS.map((scenario) => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.label}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
```

Create `src/components/OriginalMessage.tsx`:

```tsx
interface OriginalMessageProps {
  value: string;
  canAnalyze: boolean;
  isLoading: boolean;
  onChange: (value: string) => void;
  onAnalyze: () => void;
}

export function OriginalMessage({ value, canAnalyze, isLoading, onChange, onAnalyze }: OriginalMessageProps) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <p className="step-label">01 原话输入</p>
        <h2>先写下你原本想说的话</h2>
      </div>
      <label className="textarea-label">
        <span>原话</span>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="例如：你这个方案风险太高了，我们不能继续这样做。"
          rows={7}
        />
      </label>
      <button className="primary-action" type="button" disabled={!canAnalyze || isLoading} onClick={onAnalyze}>
        {isLoading ? "识别中..." : "识别意图"}
      </button>
    </section>
  );
}
```

- [ ] **Step 5: Wire App to reducer and API**

Replace `src/App.tsx` with:

```tsx
import { useReducer } from "react";
import { ConfigBar } from "./components/ConfigBar";
import { OriginalMessage } from "./components/OriginalMessage";
import { requestIntentCards } from "./lib/api";
import { initialWorkflowState, reducer, selectCanAnalyze } from "./state/workflow";

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialWorkflowState);

  async function analyze() {
    dispatch({ type: "setLoading", value: true });
    dispatch({ type: "setError", value: null });
    try {
      const response = await requestIntentCards({
        config: state.config,
        originalMessage: state.originalMessage
      });
      dispatch({
        type: "setIntentCards",
        cards: response.intentCards,
        questions: response.clarifyingQuestions
      });
      if (response.safetyRedirect) {
        dispatch({ type: "setError", value: response.safetyRedirect });
      }
    } catch (error) {
      dispatch({ type: "setError", value: error instanceof Error ? error.message : "意图识别失败，请稍后重试。" });
    } finally {
      dispatch({ type: "setLoading", value: false });
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-strip">
        <p className="eyebrow">先保真，再翻译</p>
        <h1>MBTI 对话翻译器</h1>
        <p className="intro">把同一个意图，换成对方更容易接收的信息入口。</p>
      </section>
      <ConfigBar config={state.config} onChange={(config) => dispatch({ type: "setConfig", config })} />
      {state.error ? <div className="error-banner">{state.error}</div> : null}
      <div className="workspace">
        <OriginalMessage
          value={state.originalMessage}
          canAnalyze={selectCanAnalyze(state)}
          isLoading={state.isLoading}
          onChange={(value) => dispatch({ type: "setOriginalMessage", value })}
          onAnalyze={analyze}
        />
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Expand base styles**

Append to `src/styles.css`:

```css
.config-bar,
.workspace {
  max-width: 1120px;
  margin: 20px auto 0;
}

.config-bar {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding: 16px;
  border: 1px solid #d8d5c9;
  background: #fffdfa;
}

label {
  display: grid;
  gap: 8px;
  color: #4f5b52;
  font-size: 0.9rem;
}

select,
textarea {
  width: 100%;
  border: 1px solid #c8cfc6;
  background: #ffffff;
  color: #18201b;
  border-radius: 6px;
}

select {
  min-height: 42px;
  padding: 0 12px;
}

textarea {
  resize: vertical;
  padding: 12px;
  line-height: 1.6;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}

.panel {
  border: 1px solid #d8d5c9;
  background: #fffdfa;
  padding: 20px;
}

.panel-heading {
  margin-bottom: 16px;
}

.panel-heading h2 {
  margin: 4px 0 0;
  font-size: 1.2rem;
  letter-spacing: 0;
}

.step-label {
  margin: 0;
  color: #687469;
  font-size: 0.85rem;
}

.textarea-label {
  margin-bottom: 14px;
}

.primary-action {
  min-height: 42px;
  padding: 0 16px;
  border: 0;
  border-radius: 6px;
  background: #245e4f;
  color: #ffffff;
  cursor: pointer;
}

.primary-action:disabled {
  cursor: not-allowed;
  background: #9ba9a1;
}

.error-banner {
  max-width: 1120px;
  margin: 16px auto 0;
  padding: 12px 14px;
  border: 1px solid #d08b78;
  background: #fff4ef;
  color: #803824;
}

@media (max-width: 720px) {
  .app-shell {
    padding: 20px;
  }

  .config-bar {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 7: Run UI and API client tests**

Run:

```bash
npm test -- src/App.test.tsx src/lib/api.test.ts
```

Expected: all tests pass.

- [ ] **Step 8: Commit base UI**

Run:

```bash
git add src/App.tsx src/styles.css src/components/ConfigBar.tsx src/components/OriginalMessage.tsx src/lib/api.ts src/lib/api.test.ts src/App.test.tsx
git commit -m "feat: add base translator workflow UI"
```

Expected: commit succeeds.

## Task 7: Intent Cards, Clarifying Questions, and Strength Gate

**Files:**
- Create: `src/components/IntentCards.tsx`
- Create: `src/components/ClarifyingQuestions.tsx`
- Create: `src/components/StrengthGate.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Test: `src/components/IntentCards.test.tsx`
- Test: `src/components/StrengthGate.test.tsx`

- [ ] **Step 1: Write component tests**

Create `src/components/IntentCards.test.tsx`:

```tsx
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

test("allows editing and primary marking", async () => {
  const onUpdate = vi.fn();
  const onToggle = vi.fn();

  render(<IntentCards cards={cards} canTranslate={false} onUpdate={onUpdate} onDelete={vi.fn()} onToggle={onToggle} />);

  await userEvent.clear(screen.getByLabelText("意图内容"));
  await userEvent.type(screen.getByLabelText("意图内容"), "我想提醒交付风险。");
  await userEvent.click(screen.getByRole("button", { name: "设为主意图" }));

  expect(onUpdate).toHaveBeenLastCalledWith("intent-1", "我想提醒交付风险。");
  expect(onToggle).toHaveBeenCalledWith("intent-1", "primary");
});
```

Create `src/components/StrengthGate.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
npm test -- src/components/IntentCards.test.tsx src/components/StrengthGate.test.tsx
```

Expected: tests fail because components do not exist.

- [ ] **Step 3: Create intent card component**

Create `src/components/IntentCards.tsx`:

```tsx
import { Trash2 } from "lucide-react";
import { INTENT_TYPES, type IntentCard, type IntentMarker } from "../shared/domain";

interface IntentCardsProps {
  cards: IntentCard[];
  canTranslate: boolean;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, marker: IntentMarker) => void;
}

function typeLabel(type: IntentCard["type"]): string {
  return INTENT_TYPES.find((item) => item.id === type)?.label || type;
}

export function IntentCards({ cards, canTranslate, onUpdate, onDelete, onToggle }: IntentCardsProps) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <p className="step-label">02 意图确认</p>
        <h2>确认这些意图哪些是真的</h2>
      </div>
      <div className="intent-list">
        {cards.map((card) => (
          <article className="intent-card" key={card.id}>
            <div className="intent-card-header">
              <span>{typeLabel(card.type)}</span>
              <button className="icon-button" type="button" aria-label="删除意图" onClick={() => onDelete(card.id)}>
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
            <label>
              <span>意图内容</span>
              <textarea value={card.content} rows={3} onChange={(event) => onUpdate(card.id, event.target.value)} />
            </label>
            <div className="marker-row">
              <button
                type="button"
                className={card.markers.includes("primary") ? "marker active" : "marker"}
                onClick={() => onToggle(card.id, "primary")}
              >
                设为主意图
              </button>
              <button
                type="button"
                className={card.markers.includes("sensitive") ? "marker active" : "marker"}
                onClick={() => onToggle(card.id, "sensitive")}
              >
                敏感意图
              </button>
              <button
                type="button"
                className={card.markers.includes("softenable") ? "marker active" : "marker"}
                onClick={() => onToggle(card.id, "softenable")}
              >
                可弱化
              </button>
            </div>
          </article>
        ))}
      </div>
      {!canTranslate ? <p className="hint">请选择一个主意图后再生成翻译。</p> : null}
    </section>
  );
}
```

- [ ] **Step 4: Create clarifying questions and strength gate**

Create `src/components/ClarifyingQuestions.tsx`:

```tsx
import type { ClarifyingQuestion } from "../shared/domain";

interface ClarifyingQuestionsProps {
  questions: ClarifyingQuestion[];
  answers: Record<string, string>;
  onAnswer: (id: string, value: string) => void;
}

export function ClarifyingQuestions({ questions, answers, onAnswer }: ClarifyingQuestionsProps) {
  if (questions.length === 0) {
    return null;
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <p className="step-label">03 必要澄清</p>
        <h2>回答这些问题会让翻译更保真</h2>
      </div>
      {questions.map((question) => (
        <label className="question-block" key={question.id}>
          <span>{question.question}</span>
          <small>{question.reason}</small>
          <textarea
            value={answers[question.id] || ""}
            rows={2}
            onChange={(event) => onAnswer(question.id, event.target.value)}
          />
        </label>
      ))}
    </section>
  );
}
```

Create `src/components/StrengthGate.tsx`:

```tsx
interface StrengthGateProps {
  approved: boolean;
  onChange: (approved: boolean) => void;
}

export function StrengthGate({ approved, onChange }: StrengthGateProps) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <p className="step-label">04 表达强度</p>
        <h2>表达强度确认</h2>
      </div>
      <p className="hint">
        如果原话里有较强的责备、焦虑、讽刺或控制感，系统只有在你允许后才会把这些信号变轻。
      </p>
      <label className="checkbox-line">
        <input type="checkbox" checked={approved} onChange={(event) => onChange(event.target.checked)} />
        <span>允许系统弱化强烈责备、焦虑或控制感</span>
      </label>
    </section>
  );
}
```

- [ ] **Step 5: Wire cards and gate into App**

Modify `src/App.tsx` by adding these imports:

```tsx
import { ClarifyingQuestions } from "./components/ClarifyingQuestions";
import { IntentCards } from "./components/IntentCards";
import { StrengthGate } from "./components/StrengthGate";
import { selectCanTranslate } from "./state/workflow";
```

Inside the `.workspace` div, after `<OriginalMessage />`, add:

```tsx
<IntentCards
  cards={state.intentCards}
  canTranslate={selectCanTranslate(state)}
  onUpdate={(id, content) => dispatch({ type: "updateIntentContent", id, content })}
  onDelete={(id) => dispatch({ type: "deleteIntent", id })}
  onToggle={(id, marker) => dispatch({ type: "toggleMarker", id, marker })}
/>
<ClarifyingQuestions
  questions={state.clarifyingQuestions}
  answers={state.clarificationAnswers}
  onAnswer={(id, value) => dispatch({ type: "setClarificationAnswer", id, value })}
/>
{state.intentCards.some((card) => card.markers.includes("softenable")) ? (
  <StrengthGate
    approved={state.strengthApproved}
    onChange={(value) => dispatch({ type: "setStrengthApproved", value })}
  />
) : null}
```

- [ ] **Step 6: Add component styles**

Append to `src/styles.css`:

```css
.intent-list {
  display: grid;
  gap: 12px;
}

.intent-card {
  border: 1px solid #d6ded5;
  padding: 14px;
  background: #ffffff;
}

.intent-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  color: #2d4d42;
  font-weight: 700;
}

.icon-button {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ccd4cc;
  border-radius: 6px;
  background: #ffffff;
  color: #4f5b52;
  cursor: pointer;
}

.marker-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.marker {
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid #b7c3ba;
  border-radius: 6px;
  background: #ffffff;
  color: #2f4239;
  cursor: pointer;
}

.marker.active {
  border-color: #245e4f;
  background: #e2f0eb;
  color: #174538;
}

.hint {
  color: #687469;
  line-height: 1.6;
}

.question-block {
  margin-top: 12px;
}

.question-block small {
  color: #687469;
}

.checkbox-line {
  display: flex;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 10px;
}
```

- [ ] **Step 7: Run component tests**

Run:

```bash
npm test -- src/components/IntentCards.test.tsx src/components/StrengthGate.test.tsx src/App.test.tsx
```

Expected: all tests pass.

- [ ] **Step 8: Commit intent workflow UI**

Run:

```bash
git add src/App.tsx src/styles.css src/components/IntentCards.tsx src/components/ClarifyingQuestions.tsx src/components/StrengthGate.tsx src/components/IntentCards.test.tsx src/components/StrengthGate.test.tsx
git commit -m "feat: add intent confirmation workflow"
```

Expected: commit succeeds.

## Task 8: Translation Result, Strategy Panel, and Copy Action

**Files:**
- Create: `src/components/TranslationResult.tsx`
- Create: `src/components/StrategyPanel.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Test: `src/components/TranslationResult.test.tsx`
- Test: `src/App.test.tsx`

- [ ] **Step 1: Write result component test**

Create `src/components/TranslationResult.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TranslationResult as Result } from "../shared/domain";
import { TranslationResult } from "./TranslationResult";

const result: Result = {
  translatedMessage: "我想先确认一个风险点。",
  mbtiExplanation: "考虑到 B 是 ISTJ，可能更容易接收事实清晰的表达。",
  preservedIntents: ["提醒风险"],
  adjustedExpressions: ["降低责备感"],
  strategy: {
    informationOrder: "先事实",
    tone: "克制",
    evidenceStyle: "事实",
    relationshipSignal: "共同目标",
    misunderstandingRisk: "可能先回应语气",
    adjustments: []
  }
};

test("renders translation sections and copies message", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText } });

  render(<TranslationResult result={result} />);

  expect(screen.getByText("我想先确认一个风险点。")).toBeInTheDocument();
  expect(screen.getByText(/考虑到 B 是 ISTJ/)).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "复制改写" }));
  expect(writeText).toHaveBeenCalledWith("我想先确认一个风险点。");
});
```

- [ ] **Step 2: Run test and verify it fails**

Run:

```bash
npm test -- src/components/TranslationResult.test.tsx
```

Expected: test fails because `TranslationResult.tsx` does not exist.

- [ ] **Step 3: Create translation result component**

Create `src/components/TranslationResult.tsx`:

```tsx
import { Clipboard } from "lucide-react";
import type { TranslationResult as Result } from "../shared/domain";

interface TranslationResultProps {
  result: Result | null;
}

export function TranslationResult({ result }: TranslationResultProps) {
  if (!result) {
    return null;
  }

  async function copy() {
    await navigator.clipboard.writeText(result.translatedMessage);
  }

  return (
    <section className="panel result-panel">
      <div className="panel-heading">
        <p className="step-label">05 翻译结果</p>
        <h2>可以复制发送的版本</h2>
      </div>
      <div className="translated-message">{result.translatedMessage}</div>
      <button className="primary-action icon-text" type="button" onClick={copy}>
        <Clipboard size={16} aria-hidden="true" />
        复制改写
      </button>
      <div className="result-grid">
        <section>
          <h3>MBTI 翻译说明</h3>
          <p>{result.mbtiExplanation}</p>
        </section>
        <section>
          <h3>保留了哪些意图</h3>
          <ul>
            {result.preservedIntents.map((intent) => (
              <li key={intent}>{intent}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3>调整了哪些表达</h3>
          <ul>
            {result.adjustedExpressions.map((expression) => (
              <li key={expression}>{expression}</li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create strategy panel**

Create `src/components/StrategyPanel.tsx`:

```tsx
import { summarizeDirection } from "../shared/profiles";
import type { TranslationStrategy, TranslatorConfig } from "../shared/domain";

interface StrategyPanelProps {
  config: TranslatorConfig;
  strategy: TranslationStrategy | null;
}

export function StrategyPanel({ config, strategy }: StrategyPanelProps) {
  return (
    <aside className="strategy-panel">
      <p className="step-label">沟通差异摘要</p>
      <h2>
        {config.senderType} → {config.receiverType}
      </h2>
      <p>{summarizeDirection(config.senderType, config.receiverType)}</p>
      {strategy ? (
        <dl>
          <div>
            <dt>信息顺序</dt>
            <dd>{strategy.informationOrder}</dd>
          </div>
          <div>
            <dt>语气</dt>
            <dd>{strategy.tone}</dd>
          </div>
          <div>
            <dt>误读风险</dt>
            <dd>{strategy.misunderstandingRisk}</dd>
          </div>
        </dl>
      ) : (
        <p className="hint">生成翻译后，这里会显示当前翻译策略。</p>
      )}
    </aside>
  );
}
```

- [ ] **Step 5: Wire translation request into App**

Modify `src/App.tsx` imports:

```tsx
import { StrategyPanel } from "./components/StrategyPanel";
import { TranslationResult } from "./components/TranslationResult";
import { requestIntentCards, requestTranslation } from "./lib/api";
```

Add this function inside `App`:

```tsx
async function translate() {
  dispatch({ type: "setLoading", value: true });
  dispatch({ type: "setError", value: null });
  try {
    const result = await requestTranslation({
      config: state.config,
      originalMessage: state.originalMessage,
      intentCards: state.intentCards,
      clarificationAnswers: state.clarificationAnswers,
      strengthApproved: state.strengthApproved
    });
    dispatch({ type: "setResult", result });
  } catch (error) {
    dispatch({ type: "setError", value: error instanceof Error ? error.message : "翻译生成失败，请稍后重试。" });
  } finally {
    dispatch({ type: "setLoading", value: false });
  }
}
```

Change the workspace markup to include a content column and side panel:

```tsx
<div className="workspace">
  <div className="flow-column">
    <OriginalMessage
      value={state.originalMessage}
      canAnalyze={selectCanAnalyze(state)}
      isLoading={state.isLoading}
      onChange={(value) => dispatch({ type: "setOriginalMessage", value })}
      onAnalyze={analyze}
    />
    <IntentCards
      cards={state.intentCards}
      canTranslate={selectCanTranslate(state)}
      onUpdate={(id, content) => dispatch({ type: "updateIntentContent", id, content })}
      onDelete={(id) => dispatch({ type: "deleteIntent", id })}
      onToggle={(id, marker) => dispatch({ type: "toggleMarker", id, marker })}
    />
    <ClarifyingQuestions
      questions={state.clarifyingQuestions}
      answers={state.clarificationAnswers}
      onAnswer={(id, value) => dispatch({ type: "setClarificationAnswer", id, value })}
    />
    {state.intentCards.some((card) => card.markers.includes("softenable")) ? (
      <StrengthGate
        approved={state.strengthApproved}
        onChange={(value) => dispatch({ type: "setStrengthApproved", value })}
      />
    ) : null}
    {state.intentCards.length > 0 ? (
      <button
        className="primary-action"
        type="button"
        disabled={!selectCanTranslate(state) || state.isLoading}
        onClick={translate}
      >
        {state.isLoading ? "生成中..." : "生成翻译"}
      </button>
    ) : null}
    <TranslationResult result={state.result} />
  </div>
  <StrategyPanel config={state.config} strategy={state.result?.strategy || null} />
</div>
```

- [ ] **Step 6: Add result and layout styles**

Append to `src/styles.css`:

```css
.workspace {
  grid-template-columns: minmax(0, 1fr) 320px;
  align-items: start;
}

.flow-column {
  display: grid;
  gap: 16px;
}

.strategy-panel {
  position: sticky;
  top: 20px;
  border: 1px solid #d8d5c9;
  background: #fffdfa;
  padding: 18px;
}

.strategy-panel h2 {
  margin: 4px 0 10px;
  font-size: 1.1rem;
  letter-spacing: 0;
}

.strategy-panel p,
.strategy-panel dd {
  color: #59645d;
  line-height: 1.6;
}

.strategy-panel dl {
  display: grid;
  gap: 12px;
  margin: 18px 0 0;
}

.strategy-panel dt {
  color: #2d4d42;
  font-weight: 700;
}

.strategy-panel dd {
  margin: 4px 0 0;
}

.translated-message {
  white-space: pre-wrap;
  border: 1px solid #c9d6ce;
  background: #f8fbf8;
  padding: 16px;
  line-height: 1.8;
}

.icon-text {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}

.result-grid {
  display: grid;
  gap: 14px;
  margin-top: 18px;
}

.result-grid h3 {
  margin: 0 0 8px;
  font-size: 1rem;
  letter-spacing: 0;
}

.result-grid p,
.result-grid li {
  color: #59645d;
  line-height: 1.7;
}

@media (max-width: 980px) {
  .workspace {
    grid-template-columns: 1fr;
  }

  .strategy-panel {
    position: static;
    order: -1;
  }
}
```

- [ ] **Step 7: Run result tests and full unit suite**

Run:

```bash
npm test -- src/components/TranslationResult.test.tsx src/App.test.tsx
npm test
```

Expected: all tests pass.

- [ ] **Step 8: Commit result workflow**

Run:

```bash
git add src/App.tsx src/styles.css src/components/TranslationResult.tsx src/components/StrategyPanel.tsx src/components/TranslationResult.test.tsx
git commit -m "feat: add translation result workflow"
```

Expected: commit succeeds.

## Task 9: Safety, Error Handling, and End-to-End Verification

**Files:**
- Modify: `server/mockAi.ts`
- Modify: `server/prompts.ts`
- Modify: `src/App.tsx`
- Create: `tests/e2e/app.spec.ts`
- Test: `server/mockAi.test.ts`
- Test: `tests/e2e/app.spec.ts`

- [ ] **Step 1: Add safety mock test**

Append to `server/mockAi.test.ts`:

```ts
test("mock analysis redirects manipulative goals", () => {
  const response = mockAnalyzeIntents({
    config: { senderType: "ENTJ", receiverType: "INFP", scenario: "romantic" },
    originalMessage: "帮我说到让对方内疚，然后答应我。"
  });

  expect(response.safetyRedirect).toContain("真实需求");
});
```

- [ ] **Step 2: Run test and verify it fails**

Run:

```bash
npm test -- server/mockAi.test.ts
```

Expected: new safety test fails because mock analysis does not yet redirect manipulative goals.

- [ ] **Step 3: Implement safety redirect in mock AI**

Modify the top of `mockAnalyzeIntents` in `server/mockAi.ts`:

```ts
export function mockAnalyzeIntents(request: AnalyzeIntentRequest): AnalyzeIntentResponse {
  const { originalMessage } = request;
  const manipulative = /内疚|骗|操控|PUA|逼|让.*答应/.test(originalMessage);

  if (manipulative) {
    return {
      intentCards: [
        {
          id: "intent-need",
          type: "information",
          content: "我想表达自己的真实需求，而不是通过内疚或压力让对方答应。",
          confidence: "high",
          markers: ["primary"]
        },
        {
          id: "intent-boundary",
          type: "action",
          content: "我希望用清楚、不胁迫的方式提出请求或边界。",
          confidence: "high",
          markers: ["sensitive"]
        }
      ],
      clarifyingQuestions: [],
      safetyRedirect: "这个目标容易变成操控或内疚诱导。我会改为帮你表达真实需求、请求和边界。"
    };
  }

  const hasStrongSignal = /太|不能|总是|从来|离谱|烦|失望|为什么/.test(originalMessage);
```

Keep the rest of the function body after `hasStrongSignal` unchanged.

- [ ] **Step 4: Add browser e2e test**

Create `tests/e2e/app.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("completes the mock translation workflow on desktop", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("发送者 A").selectOption("ENFP");
  await page.getByLabel("接收者 B").selectOption("ISTJ");
  await page.getByLabel("使用场景").selectOption("work");
  await page.getByLabel("原话").fill("你这个方案风险太高了，我们不能继续这样做。");

  await page.getByRole("button", { name: "识别意图" }).click();
  await expect(page.getByText("确认这些意图哪些是真的")).toBeVisible();
  await expect(page.getByText("我想让对方知道当前表达里存在我在意的风险或问题。")).toBeVisible();

  await page.getByRole("button", { name: "生成翻译" }).click();
  await expect(page.getByText("可以复制发送的版本")).toBeVisible();
  await expect(page.getByText(/考虑到|可能/)).toBeVisible();
});

test("keeps the core workflow usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "MBTI 对话翻译器" })).toBeVisible();
  await expect(page.getByLabel("原话")).toBeVisible();
});
```

- [ ] **Step 5: Run safety and e2e verification**

Run:

```bash
npm test -- server/mockAi.test.ts
npx playwright install chromium webkit
npm run test:e2e
```

Expected: safety test passes and Playwright verifies desktop and mobile flows.

- [ ] **Step 6: Run full verification**

Run:

```bash
npm run lint
npm test
npm run build
```

Expected: TypeScript, unit tests, and production build all pass.

- [ ] **Step 7: Commit safety and verification**

Run:

```bash
git add server/mockAi.ts server/mockAi.test.ts server/prompts.ts tests/e2e/app.spec.ts
git commit -m "feat: add safety redirects and e2e checks"
```

Expected: commit succeeds.

## Task 10: Final Browser QA and README

**Files:**
- Create: `README.md`
- Modify: `src/styles.css`

- [ ] **Step 1: Create usage README**

Create `README.md`:

```md
# MBTI 对话翻译器

一个单人使用的网页原型，用于把发送者 A 的原话翻译成接收者 B 更容易接收的表达方式。

核心原则：先保真，再翻译。

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:5173`。

没有 `OPENAI_API_KEY` 时，API 会使用本地 mock 响应，方便验证完整流程。

## 使用 OpenAI API

```bash
export OPENAI_API_KEY="你的 API key"
export OPENAI_MODEL="gpt-5-mini"
npm run dev
```

服务端通过 Responses API 的 Structured Outputs 生成稳定 JSON 响应。

## 第一版范围

- 选择发送者和接收者 MBTI。
- 选择固定场景。
- 输入原话。
- 生成、编辑、删除和标记意图卡。
- 必要时回答澄清问题。
- 确认是否允许弱化强表达信号。
- 生成改写文本、MBTI 翻译说明、保留意图和调整说明。

## 安全边界

产品不做心理诊断，不把 MBTI 当作绝对判断，也不帮助操控、欺骗或胁迫他人。
```

- [ ] **Step 2: Run local server**

Run:

```bash
npm run dev
```

Expected: terminal shows Vite running at `http://localhost:5173` and API server running at `http://localhost:8787`.

- [ ] **Step 3: Browser QA checklist**

Open `http://localhost:5173` in the browser and verify:

- The page loads without console errors.
- Desktop layout shows config, main flow, and side strategy panel.
- Mobile width stacks sections vertically without text overlap.
- The mock happy path can reach final translated output.
- The copy button calls clipboard without crashing.
- The safety input `帮我说到让对方内疚，然后答应我。` shows a redirect message.

- [ ] **Step 4: Stop dev server**

Stop the running dev server with `Ctrl+C`.

Expected: no `npm run dev` process remains active for this workspace.

- [ ] **Step 5: Run final automated verification**

Run:

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

Expected: all commands pass.

- [ ] **Step 6: Commit docs and final polish**

Run:

```bash
git add README.md src/styles.css
git commit -m "docs: add local usage guide"
```

Expected: commit succeeds and `git status --short` is clean.

## Self-Review Notes

- Spec coverage: the plan covers A/B MBTI selection, four scenarios, original input, AI-generated intent cards, card editing and markers, clarifying questions, strength confirmation, gentle MBTI explanation, copy action, safety redirect, mock fallback, and browser verification.
- Type consistency: domain types in `src/shared/domain.ts`, Zod schemas in `src/shared/contracts.ts`, reducer state in `src/state/workflow.ts`, and API route payloads use the same names.
- Execution boundary: this plan builds the first-version single-user web prototype only; accounts, history, collaboration, plugins, and chat-app integrations are excluded.
