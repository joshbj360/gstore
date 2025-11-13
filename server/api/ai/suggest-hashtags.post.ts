import { defineEventHandler, readBody, createError } from 'h3';
import { z } from 'zod';

const config = useRuntimeConfig();
// THE FIX: Use the Google API key from your nuxt.config.ts
const geminiApiKey = config.googleApiKey;

const schema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
});

export default defineEventHandler(async (event) => {
  // THE FIX: Check for the correct key
  if (!geminiApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'AI server not configured.' });
  }

  const validation = await readValidatedBody(event, body => schema.safeParse(body));
  if (!validation.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid product info.' });
  }
  const { title, category } = validation.data;

  // THE FIX: This is the same prompt, which works perfectly for Gemini
  const promptContent = `Generate 10-15 relevant hashtags for social media marketing.

Product: ${title}
Category: ${category}

Return ONLY a JSON array of hashtag strings without the # symbol, like:
["fashion", "style", "trending", "shopping"]`;

  try {
    // THE FIX: Use the Gemini API endpoint
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
        ],
        // THE FIX: Force JSON output from Gemini
        generationConfig: {
          responseMimeType: "application/json",
        }
      }
    });

    // Extract the text from Gemini's response
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('AI returned an empty response.');
    }

    // Clean and parse the JSON response
    // The replace() calls are a good safeguard in case Gemini adds markdown
    const hashtags = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, ''));

    return { hashtags };
  } catch (error: any) {
    console.error('Gemini AI Hashtags Error:', error.data?.error || error.message);
    throw createError({ statusCode: 502, statusMessage: 'AI service failed to respond.' });
  }
});