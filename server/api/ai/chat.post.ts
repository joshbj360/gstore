// server/api/ai/chat.post.ts
import { defineEventHandler, readBody, createError } from 'h3';
import { OpenAI } from 'openai'; // or xAI Grok
import prisma from '~/server/prisma/prismaClient';
import type { IProduct } from '~/models';
import prismaClient from '~/server/prisma/prismaClient';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default defineEventHandler(async (event) => {
  const { productId, message, context } = await readBody(event);

  if (!message) throw createError({ statusCode: 400, statusMessage: 'Message required' });

  // Fetch DB Context (RAG)
  let productContext: IProduct | null = null;
  if (productId) {
    productContext = await prisma.products.findUnique({
      where: { id: productId },
      include: { variants: true, seller: true },
    }) as IProduct | null;
  }

  const contextStr = context ? JSON.stringify(context) : JSON.stringify({ product: productContext });

  const prompt = `You are GStore's Style Scout AI—a witty, fashion-forward assistant. Context: ${contextStr}. User: "${message}". Reply concisely (1-2 sentences), grounded in stock/variants (e.g., "5 XL left!"). Suggest pairings or similar drops. End with a question. Keep it TikTok-cool, cool, personal.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
      temperature: 0.8, // Creative flair
    });

    const reply = completion.choices[0]?.message?.content || 'Style tip: Go bold with accessories! What\'s your occasion?';

    return { reply };
  } catch (error) {
    console.error('AI Chat Error:', error);
    return { reply: 'Quick style hack: Layer with neutrals for everyday slay. What look are you chasing?' };
  }
});