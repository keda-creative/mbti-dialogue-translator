import { z } from "zod";
import {
  EXPRESSION_SIGNALS,
  INTENT_CONFIDENCE_LEVELS,
  INTENT_MARKERS,
  INTENT_TYPE_IDS,
  MBTI_TYPES,
  SCENARIO_IDS
} from "./domain";

const mbtiTypeSchema = z.enum(MBTI_TYPES);
const scenarioSchema = z.enum(SCENARIO_IDS);
const intentTypeSchema = z.enum(INTENT_TYPE_IDS);
const intentMarkerSchema = z.enum(INTENT_MARKERS);
const intentConfidenceSchema = z.enum(INTENT_CONFIDENCE_LEVELS);
const expressionSignalSchema = z.enum(EXPRESSION_SIGNALS);

export const translatorConfigSchema = z.object({
  senderType: mbtiTypeSchema,
  receiverType: mbtiTypeSchema,
  scenario: scenarioSchema
});

export const intentCardSchema = z.object({
  id: z.string().min(1),
  type: intentTypeSchema,
  content: z.string().min(1),
  confidence: intentConfidenceSchema,
  markers: z.array(intentMarkerSchema)
});

export const clarifyingQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  reason: z.string().min(1)
});

export const analyzeIntentRequestSchema = z.object({
  config: translatorConfigSchema,
  originalMessage: z.string().trim().min(1),
  conversationBackground: z.string().max(1000).optional()
});

export const analyzeIntentResponseSchema = z.object({
  intentCards: z.array(intentCardSchema).min(1).max(6),
  clarifyingQuestions: z.array(clarifyingQuestionSchema).max(3),
  safetyRedirect: z.string().nullable()
});

const expressionAdjustmentSchema = z.object({
  signal: expressionSignalSchema,
  originalSignal: z.string().min(1),
  suggestedChange: z.string().min(1),
  requiresApproval: z.boolean()
});

const translationStrategySchema = z.object({
  informationOrder: z.string().min(1),
  tone: z.string().min(1),
  evidenceStyle: z.string().min(1),
  relationshipSignal: z.string().min(1),
  misunderstandingRisk: z.string().min(1),
  adjustments: z.array(expressionAdjustmentSchema)
});

export const translationRequestSchema = z.object({
  config: translatorConfigSchema,
  originalMessage: z.string().trim().min(1),
  conversationBackground: z.string().max(1000).optional(),
  intentCards: z.array(intentCardSchema).min(1),
  clarificationAnswers: z.record(z.string(), z.string()),
  strengthApproved: z.boolean()
});

export const translationResponseSchema = z.object({
  translatedMessage: z.string().min(1),
  mbtiExplanation: z.string().min(1),
  preservedIntents: z.array(z.string().min(1)).min(1),
  adjustedExpressions: z.array(z.string().min(1)),
  strategy: translationStrategySchema
});

export type AnalyzeIntentRequest = z.infer<typeof analyzeIntentRequestSchema>;
export type AnalyzeIntentResponse = z.infer<typeof analyzeIntentResponseSchema>;
export type TranslationRequest = z.infer<typeof translationRequestSchema>;
export type TranslationResponse = z.infer<typeof translationResponseSchema>;
