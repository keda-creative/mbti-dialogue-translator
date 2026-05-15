# MBTI 对话翻译器

一个单人使用的网页原型，用于把发送者 A 的原话翻译成接收者 B 更容易接收的表达方式。

核心原则：先保真，再翻译。

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:5173`。

没有配置模型 key 时，API 会使用本地 mock 响应，方便验证完整流程。

## 使用 DeepSeek API

推荐把本地密钥放在不会提交的 `.env.local`：

```bash
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY="你的 DeepSeek API key"
DEEPSEEK_MODEL="deepseek-v4-flash"
```

然后运行：

```bash
npm run dev
```

服务端会通过 DeepSeek 的 OpenAI-compatible Chat Completions 接口生成 JSON 响应。

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
