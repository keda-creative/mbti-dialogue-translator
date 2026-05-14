/// <reference types="node" />

import OpenAI from "openai";
import {
  analyzeIntentResponseSchema,
  translationResponseSchema,
  type AnalyzeIntentRequest,
  type AnalyzeIntentResponse,
  type TranslationRequest,
  type TranslationResponse
} from "../src/shared/contracts";
import {
  EXPRESSION_SIGNALS,
  INTENT_CONFIDENCE_LEVELS,
  INTENT_MARKERS,
  INTENT_TYPE_IDS
} from "../src/shared/domain";
import { mockAnalyzeIntents, mockGenerateTranslation } from "./mockAi";
import { buildIntentPrompt, buildTranslationPrompt } from "./prompts";

type JsonSchema = Record<string, unknown>;

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
        maxItems: 3,
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
  env: Pick<NodeJS.ProcessEnv, "OPENAI_API_KEY">
): boolean {
  return !env.OPENAI_API_KEY?.trim();
}

function getModel(): string {
  return process.env.OPENAI_MODEL || "gpt-5-mini";
}

function createClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey });
}

async function createStructuredResponse<T>(
  prompt: string,
  format: JsonSchemaFormat,
  parse: (data: unknown) => T
): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for OpenAI responses.");
  }

  const client = createClient(apiKey);
  const response = await client.responses.create({
    model: getModel(),
    input: prompt,
    text: { format }
  });

  return parse(JSON.parse(response.output_text));
}

export async function analyzeIntents(
  request: AnalyzeIntentRequest
): Promise<AnalyzeIntentResponse> {
  if (shouldUseMockAi({ OPENAI_API_KEY: process.env.OPENAI_API_KEY })) {
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
  if (shouldUseMockAi({ OPENAI_API_KEY: process.env.OPENAI_API_KEY })) {
    return mockGenerateTranslation(request);
  }

  return createStructuredResponse(
    buildTranslationPrompt(request),
    translationFormat,
    (data) => translationResponseSchema.parse(data)
  );
}
