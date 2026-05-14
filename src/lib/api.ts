import {
  analyzeIntentResponseSchema,
  translationResponseSchema,
  type AnalyzeIntentRequest,
  type AnalyzeIntentResponse,
  type TranslationRequest,
  type TranslationResponse
} from "../shared/contracts";

const DEFAULT_ERROR_MESSAGE = "请求失败，请稍后重试。";

function readErrorMessage(payload: unknown): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string" &&
    payload.message.length > 0
  ) {
    return payload.message;
  }

  return DEFAULT_ERROR_MESSAGE;
}

async function postJson<TResponse>(
  url: string,
  body: unknown,
  parse: (value: unknown) => TResponse
): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const payload: unknown = await response.json();
  if (!response.ok) {
    throw new Error(readErrorMessage(payload));
  }

  return parse(payload);
}

export function requestIntentCards(
  request: AnalyzeIntentRequest
): Promise<AnalyzeIntentResponse> {
  return postJson("/api/intent-cards", request, (value) =>
    analyzeIntentResponseSchema.parse(value)
  );
}

export function requestTranslation(
  request: TranslationRequest
): Promise<TranslationResponse> {
  return postJson("/api/translation", request, (value) =>
    translationResponseSchema.parse(value)
  );
}
