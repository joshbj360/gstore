import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) return []; // Return empty cart for guests

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: {
      variant: {
        include: {
          product: {
            include: {
              media: true
            }
          }
        }
      }
    }
  });
  if (!cartItems) return [];
  return cartItems;
});