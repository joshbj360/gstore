import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' });

  const { variantId, quantity } = await readBody(event);
  if (!variantId || !quantity) {
    throw createError({ statusCode: 400, message: 'Variant ID and quantity are required' });
  }

  // Use `upsert` for an efficient "add or update quantity" operation
  const cartItem = await prisma.cartItem.upsert({
    where: {
      userId_variantId: {
        userId: user.id,
        variantId: variantId,
      },
    },
    update: {
      quantity: {
        increment: quantity,
      },
    },
    create: {
      userId: user.id,
      variantId: variantId,
      quantity: quantity,
    },
  });

  return cartItem;
});