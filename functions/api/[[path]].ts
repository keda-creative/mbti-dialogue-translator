/// <reference types="@cloudflare/workers-types" />

// 将 API 请求代理到 Vercel 后端
const API_BASE_URL = "https://mbti-dialogue-translator.vercel.app";

export const onRequest: PagesFunction = async (context) => {
  const { request, params } = context;
  const url = new URL(request.url);
  const apiPath = (params.path as string[]) || [];

  // 只代理 /api/* 路径
  if (!apiPath.length) {
    return new Response("Not Found", { status: 404 });
  }

  const targetUrl = `${API_BASE_URL}/api/${apiPath.join("/")}${url.search}`;

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        "Content-Type": "application/json",
      },
      body: request.method !== "GET" ? await request.text() : undefined,
    });

    // 返回代理结果
    const body = await response.text();
    return new Response(body, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(
      JSON.stringify({ message: "服务暂时不可用，请稍后重试。" }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
