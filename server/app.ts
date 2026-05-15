import cors from "cors";
import express from "express";
import {
  analyzeIntentRequestSchema,
  translationRequestSchema
} from "../src/shared/contracts.js";
import { analyzeIntents, generateTranslation } from "./openai.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_request, response) => {
    response.json({ ok: true });
  });

  app.post("/api/intent-cards", async (request, response) => {
    const parsed = analyzeIntentRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      response
        .status(400)
        .json({ message: "请求格式不完整，请检查 MBTI、场景和原话。" });
      return;
    }

    try {
      response.json(await analyzeIntents(parsed.data));
    } catch (error) {
      console.error("Intent analysis failed", error);
      response.status(500).json({ message: "意图识别失败，请稍后重试。" });
    }
  });

  app.post("/api/translation", async (request, response) => {
    const parsed = translationRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      response
        .status(400)
        .json({ message: "翻译请求缺少已确认意图，请检查保留意图。" });
      return;
    }

    const hasPreservedIntent = parsed.data.intentCards.some((card) =>
      card.markers.includes("primary")
    );

    if (!hasPreservedIntent) {
      response.status(400).json({ message: "请至少选择一个要保留的意图。" });
      return;
    }

    try {
      response.json(await generateTranslation(parsed.data));
    } catch (error) {
      console.error("Translation generation failed", error);
      response.status(500).json({ message: "翻译生成失败，请稍后重试。" });
    }
  });

  return app;
}
