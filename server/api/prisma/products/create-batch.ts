// server/api/prisma/products/create-batch.ts

import prisma from '~/server/prisma/prismaClient'; // Your extended client
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' });

  const sellerProfile = await prisma.sellerProfile.findUnique({ where: { profileId: user.id } });
  if (!sellerProfile) throw createError({ statusCode: 403, message: 'Seller profile not found.' });

  const { products } = await readBody<{ products: any[] }>(event);
  if (!products || products.length === 0) {
    throw createError({ statusCode: 400, message: 'No products provided.' });
  }

  try {
    for (const productData of products) {
      // You just call .create() as normal.
      // The Prisma Extension will automatically generate the unique slug in the background.
      await prisma.products.create({
        data: {
          title: productData.title,
          description: productData.description,
          price: productData.price,
          // No need to specify the slug here! The extension handles it.
          sellerId: user.id,
          store_name: sellerProfile.store_name!,
          variants: { create: productData.variants },
          media: { create: productData.media.map((m: any) => ({ ...m, sellerId: user.id })) },
          category: { create: [{ category: { connectOrCreate: { where: { name: productData.category }, create: { name: productData.category } } } }] },
          tags: { create: productData.tags.map((tag: string) => ({ tag: { connectOrCreate: { where: { name: tag }, create: { name: tag } } } })) },
        },
      });
    }

    return { success: true, count: products.length };

  } catch (error: any) {
    console.error('Error creating product batch:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create product batch.',
      message: error.message,
    });
  }
});