import { defineEventHandler, readBody, createError } from 'h3';
import { z } from 'zod';

const config = useRuntimeConfig();
// THE FIX: Use the Google API key
const geminiApiKey = config.googleApiKey;

const schema = z.object({
  platformId: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  price: z.any(),
  tags: z.array(z.string()).optional(),
});

const platformLimits: any = {
  instagram: 2200,
  facebook: 63206,
  twitter: 280
};

export default defineEventHandler(async (event) => {
  // THE FIX: Check for the correct key
  if (!geminiApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'AI server not configured.' });
  }

  const validation = await readValidatedBody(event, body => schema.safeParse(body));
  if (!validation.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid product info.' });
  }

  const { platformId, title, description, price, tags } = validation.data;
  const limit = platformLimits[platformId] || 1000;

  const hashtagList = tags && tags.length > 0
    ? `Incorporate these relevant hashtags (with the # prefix): ${tags.join(', ')}`
    : 'Include 3-5 relevant hashtags (with the # prefix).';

  // THE FIX: This is the prompt for Gemini
  const promptContent = `Generate an engaging social media caption for ${platformId}.

Product: ${title}
Description: ${description}
Price: $${price}
Platform: ${platformId}
Character limit: ${limit}

Make it:
- Platform-appropriate (${platformId === 'twitter' ? 'concise' : platformId === 'instagram' ? 'visual and engaging' : 'informative'})
- Include emojis
- Engaging and clickable
- ${hashtagList}
- Under ${limit} characters

Return ONLY the caption text.`;

  try {
    // THE FIX: Use the Gemini API endpoint
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`;

    const response: any = await $fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        // Gemini API payload structure
        contents: [
          {
            parts: [
              { "text": promptContent }
            ]
          }
        ]
      }
    });

    // Parse the Gemini response
    const caption = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!caption) {
      throw new Error('AI returned an empty response.');
    }

    return { caption: caption.trim() };
  } catch (error: any) {
    console.error('Gemini AI Caption Error:', error.data?.error || error.message);
    throw createError({ statusCode: 502, statusMessage: 'AI service failed to respond.' });
  }
});