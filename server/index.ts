/// <reference types="node" />

import cors from "cors";
import express from "express";
import {
  analyzeIntentRequestSchema,
  translationRequestSchema
} from "../src/shared/contracts";
import { analyzeIntents, generateTranslation } from "./openai";

export const app = express();

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
      .json({ message: "翻译请求缺少已确认意图，请检查卡片标记。" });
    return;
  }

  const hasPrimaryIntent = parsed.data.intentCards.some((card) =>
    card.markers.includes("primary")
  );

  if (!hasPrimaryIntent) {
    response.status(400).json({ message: "请先标记一个主意图。" });
    return;
  }

  try {
    response.json(await generateTranslation(parsed.data));
  } catch (error) {
    console.error("Translation generation failed", error);
    response.status(500).json({ message: "翻译生成失败，请稍后重试。" });
  }
});

const port = Number(process.env.PORT || 8787);

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
