import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';
import { z } from 'zod'; // Import zod for schema validation

// The Zod schema remains the same. It's our single source of truth for the request shape.
const cartActionSchema = z.object({
  variantId: z.number().positive('A valid Product Variant ID is required.'),
  quantity: z.number().positive('A valid quantity is required.').optional(),
});

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  // THE FIX: We use the more basic `readBody` first to get the raw request body.
  const body = await readBody(event);

  // THE FIX: We then manually validate the body against our schema using `safeParse`.
  // `safeParse` will not throw an error; instead, it returns a success or error object.
  const validation = cartActionSchema.safeParse(body);

  if (!validation.success) {
    // If validation fails, we throw a 400 error with the detailed issues from Zod.
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request body',
      message: validation.error.issues.map(issue => issue.message).join(', '),
    });
  }

  // If validation succeeds, we can safely use the validated data.
  const { variantId, quantity } = validation.data;

  const where = {
    userId_variantId: {
      userId: user.id,
      variantId: variantId,
    },
  };

  try {

    if (!quantity) throw createError({ statusCode: 400, message: 'Quantity is required for the "add" action.' });
    return await prisma.cartItem.upsert({
      where,
      update: { quantity: { increment: quantity } },
      create: { userId: user.id, variantId: variantId, quantity: quantity },
    });


  } catch (error: any) {
    console.error("Cart API Error:", error);
    if (error.code === 'P2025') { // Prisma's "Record not found" error
      throw createError({ statusCode: 404, message: 'Cart item not found.' });
    }
    throw createError({ statusCode: 500, message: 'Could not modify cart item.' });
  }
});

