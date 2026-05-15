/// <reference types="node" />

import OpenAI from "openai";
import {
  analyzeIntentResponseSchema,
  translationResponseSchema,
  type AnalyzeIntentRequest,
  type AnalyzeIntentResponse,
  type TranslationRequest,
  type TranslationResponse
} from "../src/shared/contracts.js";
import {
  EXPRESSION_SIGNALS,
  INTENT_CONFIDENCE_LEVELS,
  INTENT_MARKERS,
  INTENT_TYPE_IDS
} from "../src/shared/domain.js";
import { mockAnalyzeIntents, mockGenerateTranslation } from "./mockAi.js";
import { buildIntentPrompt, buildTranslationPrompt } from "./prompts.js";

type JsonSchema = Record<string, unknown>;
type AiProvider = "openai" | "deepseek";
type ProviderEnv = {
  AI_PROVIDER?: string;
  OPENAI_API_KEY?: string;
  DEEPSEEK_API_KEY?: string;
};

type JsonSchemaFormat = {
  type: "json_schema";
  name: string;
  description: string;
  strict: true;
  schema: JsonSchema;
};

const stringSchema = { type: "string" } as const;

const stringArraySchema = {
  type: "array",
  items: stringSchema
} as const;

const intentCardSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: stringSchema,
    type: { type: "string", enum: INTENT_TYPE_IDS },
    content: stringSchema,
    confidence: { type: "string", enum: INTENT_CONFIDENCE_LEVELS },
    markers: {
      type: "array",
      items: { type: "string", enum: INTENT_MARKERS }
    }
  },
  required: ["id", "type", "content", "confidence", "markers"]
};

const clarifyingQuestionSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: stringSchema,
    question: stringSchema,
    reason: stringSchema
  },
  required: ["id", "question", "reason"]
};

const expressionAdjustmentSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    signal: { type: "string", enum: EXPRESSION_SIGNALS },
    originalSignal: stringSchema,
    suggestedChange: stringSchema,
    requiresApproval: { type: "boolean" }
  },
  required: [
    "signal",
    "originalSignal",
    "suggestedChange",
    "requiresApproval"
  ]
};

const translationStrategySchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    informationOrder: stringSchema,
    tone: stringSchema,
    evidenceStyle: stringSchema,
    relationshipSignal: stringSchema,
    misunderstandingRisk: stringSchema,
    adjustments: {
      type: "array",
      items: expressionAdjustmentSchema
    }
  },
  required: [
    "informationOrder",
    "tone",
    "evidenceStyle",
    "relationshipSignal",
    "misunderstandingRisk",
    "adjustments"
  ]
};

const intentAnalysisFormat: JsonSchemaFormat = {
  type: "json_schema",
  name: "intent_analysis",
  description: "MBTI dialogue translator intent analysis response.",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      intentCards: {
        type: "array",
        minItems: 1,
        maxItems: 6,
        items: intentCardSchema
      },
      clarifyingQuestions: {
        type: "array",
        maxItems: 0,
        items: clarifyingQuestionSchema
      },
      safetyRedirect: {
        type: ["string", "null"]
      }
    },
    required: ["intentCards", "clarifyingQuestions", "safetyRedirect"]
  }
};

const translationFormat: JsonSchemaFormat = {
  type: "json_schema",
  name: "translation_result",
  description: "MBTI dialogue translator translated message response.",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      translatedMessage: stringSchema,
      mbtiExplanation: stringSchema,
      preservedIntents: {
        ...stringArraySchema,
        minItems: 1
      },
      adjustedExpressions: stringArraySchema,
      strategy: translationStrategySchema
    },
    required: [
      "translatedMessage",
      "mbtiExplanation",
      "preservedIntents",
      "adjustedExpressions",
      "strategy"
    ]
  }
};

export function shouldUseMockAi(
  env: ProviderEnv
): boolean {
  return !getProviderConfig(env).apiKey;
}

function getProvider(env = process.env): AiProvider {
  return env.AI_PROVIDER === "deepseek" ? "deepseek" : "openai";
}

function getOpenAiModel(): string {
  return process.env.OPENAI_MODEL || "gpt-5-mini";
}

function getDeepSeekModel(): string {
  return process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
}

function getProviderConfig(
  env: ProviderEnv = process.env
) {
  const provider = getProvider(env);
  const apiKey =
    provider === "deepseek" ? env.DEEPSEEK_API_KEY?.trim() : env.OPENAI_API_KEY?.trim();
  return { provider, apiKey };
}

function createOpenAiClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey });
}

function createDeepSeekClient(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
    baseURL: "https://api.deepseek.com"
  });
}

function getDeepSeekJsonExample(format: JsonSchemaFormat): string {
  if (format.name === "intent_analysis") {
    return JSON.stringify(
      {
        intentCards: [
          {
            id: "intent-1",
            type: "information",
            content: "我想让对方知道这件事对我很重要。",
            confidence: "high",
            markers: ["primary"]
          },
          {
            id: "intent-2",
            type: "action",
            content: "我希望对方接下来能给出明确回应。",
            confidence: "medium",
            markers: []
          }
        ],
        clarifyingQuestions: [],
        safetyRedirect: null
      },
      null,
      2
    );
  }

  return JSON.stringify(
    {
      translatedMessage: "我想先确认一下这件事对我们的影响，再一起决定下一步。",
      mbtiExplanation:
        "考虑到接收方可能更容易接收先事实后请求的表达，已把原话整理为更清晰的顺序。",
      preservedIntents: ["我想表达这件事对我很重要。"],
      adjustedExpressions: ["把容易被听成责备的部分改成事实和请求。"],
      strategy: {
        informationOrder: "先事实，再说明感受，最后提出请求",
        tone: "清晰、克制、尊重边界",
        evidenceStyle: "具体事实和当前影响",
        relationshipSignal: "强调共同目标和允许对方回应",
        misunderstandingRisk: "对方可能先听成指责或否定。",
        adjustments: [
          {
            signal: "intensity",
            originalSignal: "强烈否定",
            suggestedChange: "保留立场，但降低攻击感。",
            requiresApproval: true
          }
        ]
      }
    },
    null,
    2
  );
}

function buildDeepSeekJsonPrompt(prompt: string, format: JsonSchemaFormat): string {
  return `${prompt}

你必须只输出一个合法 JSON object，不要输出 Markdown，不要输出解释文字。
JSON object 必须严格符合下面示例的字段名和字段类型；数组元素也必须包含示例里的所有字段。
允许根据用户数据改变字段值，但不要新增字段、不要省略字段。

EXAMPLE JSON OUTPUT:
${getDeepSeekJsonExample(format)}`;
}

async function createOpenAiStructuredResponse<T>(
  prompt: string,
  format: JsonSchemaFormat,
  parse: (data: unknown) => T
): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for OpenAI responses.");
  }

  const client = createOpenAiClient(apiKey);
  const response = await client.responses.create({
    model: getOpenAiModel(),
    input: prompt,
    text: { format }
  });

  return parse(JSON.parse(response.output_text));
}

async function createDeepSeekStructuredResponse<T>(
  prompt: string,
  format: JsonSchemaFormat,
  parse: (data: unknown) => T
): Promise<T> {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is required for DeepSeek responses.");
  }

  const client = createDeepSeekClient(apiKey);
  const completion = await client.chat.completions.create({
    model: getDeepSeekModel(),
    messages: [
      {
        role: "user",
        content: buildDeepSeekJsonPrompt(prompt, format)
      }
    ],
    max_tokens: 4000,
    response_format: { type: "json_object" },
    stream: false
  });
  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("DeepSeek returned an empty response.");
  }

  return parse(JSON.parse(content));
}

async function createStructuredResponse<T>(
  prompt: string,
  format: JsonSchemaFormat,
  parse: (data: unknown) => T
): Promise<T> {
  if (getProvider() === "deepseek") {
    return createDeepSeekStructuredResponse(prompt, format, parse);
  }

  return createOpenAiStructuredResponse(prompt, format, parse);
}

export async function analyzeIntents(
  request: AnalyzeIntentRequest
): Promise<AnalyzeIntentResponse> {
  if (shouldUseMockAi(process.env)) {
    return mockAnalyzeIntents(request);
  }

  return createStructuredResponse(
    buildIntentPrompt(request),
    intentAnalysisFormat,
    (data) => analyzeIntentResponseSchema.parse(data)
  );
}

export async function generateTranslation(
  request: TranslationRequest
): Promise<TranslationResponse> {
  if (shouldUseMockAi(process.env)) {
    return mockGenerateTranslation(request);
  }

  return createStructuredResponse(
    buildTranslationPrompt(request),
    translationFormat,
    (data) => translationResponseSchema.parse(data)
  );
}
