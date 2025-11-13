import { defineEventHandler, readBody, createError } from 'h3';
import { z } from 'zod';

const config = useRuntimeConfig();
// This now reads from the new key we set up in nuxt.config.ts
const geminiApiKey = config.googleApiKey;

// Zod schema for validation
const schema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  price: z.any(),
  description: z.string()
});

export default defineEventHandler(async (event) => {
  if (!geminiApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'AI server not configured. Missing GOOGLE_API_KEY.' });
  }

  const validation = await readValidatedBody(event, body => schema.safeParse(body));
  if (!validation.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid product info.' });
  }

  const { title, category, price, description } = validation.data;

  const promptContent = `Generate a compelling product description for e-commerce.

Product: ${title}
Category: ${category}
Price: $${price}
initial description: ${description}

Create a 2-3 paragraph description that:
- Highlights and itemize using bullets key features and benefits
- Uses engaging, persuasive language
- Captures the essence of the product
- Is clear, concise, and easy to understand
- It support HTML tags
- Includes a call-to-action
- Is optimized for online shopping

Return ONLY the description text.`;

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`;

    const response: any = await $fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        contents: [
          {
            parts: [
              { "text": promptContent }
            ]
          }
        ]
      }
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('AI returned an empty response.');
    }
    return { description: text.trim() };

  } catch (err: any) {
    console.error('Gemini API Error:', err.data?.error || err.message);
    throw createError({ statusCode: 502, statusMessage: 'AI service temporarily unavailable.' });
  }
});