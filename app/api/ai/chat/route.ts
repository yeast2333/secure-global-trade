import { NextResponse } from "next/server";
import { z } from "zod";

import { createApiHandler } from "@/lib/api-handler";

const messageSchema = z.object({
  role: z.enum(["assistant", "user"]),
  content: z.string().min(1).max(4000),
});

const schema = z.object({
  messages: z.array(messageSchema).min(1).max(20),
});

const systemPrompt = `你是一个面向跨境B2B网站的人工智能客服，负责回答商品、库存、物流、订单、售后、批量采购、付款和交付相关问题。

要求：
1. 用简洁、专业、友好的中文回答。
2. 如果用户询问商品，优先引导查看商品页或联系客服。
3. 不要编造不存在的库存、价格或政策。
4. 如果不确定，请明确说明并建议联系人工客服。
5. 回答尽量控制在 3-6 句话内。`;

export const POST = createApiHandler(schema, async (payload) => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, message: "缺少 DEEPSEEK_API_KEY 环境变量" }, { status: 500 });
  }

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        ...payload.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { ok: false, message: `DeepSeek API 调用失败：${errorText}` },
      { status: 500 },
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    return NextResponse.json({ ok: false, message: "DeepSeek 未返回有效回复" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, reply });
});
