import {
  analyzeIntentResponseSchema,
  translationResponseSchema,
  type AnalyzeIntentRequest,
  type AnalyzeIntentResponse,
  type TranslationRequest,
  type TranslationResponse
} from "../shared/contracts";

const DEFAULT_ERROR_MESSAGE = "请求失败，请稍后重试。";
const INVALID_RESPONSE_MESSAGE = "服务返回格式不完整，请稍后重试。";
const TIMEOUT_ERROR_MESSAGE = "请求超时，请稍后重试。";
const API_REQUEST_TIMEOUT_MS = 15000;

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

async function readJsonSafely(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function postJson<TResponse>(
  url: string,
  body: unknown,
  parse: (value: unknown) => TResponse
): Promise<TResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    const payload = await readJsonSafely(response);
    if (!response.ok) {
      throw new Error(readErrorMessage(payload));
    }

    try {
      return parse(payload);
    } catch {
      throw new Error(INVALID_RESPONSE_MESSAGE);
    }
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(TIMEOUT_ERROR_MESSAGE);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
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
