import { PrismaClient } from '@prisma/client';
import { serverSupabaseUser } from '#supabase/server';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' });

  const sellerProfile = await prisma.sellerProfile.findUnique({ where: { profileId: user.id } });
  if (!sellerProfile) throw createError({ statusCode: 403, message: 'Seller profile not found.' });

  const body = await readBody<{ products: any[] }>(event);
  if (!body.products || body.products.length === 0) {
    throw createError({ statusCode: 400, message: 'No products provided in the batch.' });
  }

  // We will now process each product individually without a transaction wrapper.
  try {
    for (const productData of body.products) {
      // Each 'create' is now its own atomic operation.
      await prisma.products.create({
        data: {
          title: productData.title,
          description: productData.description,
          price: productData.price,
          slug: productData.slug,
          sellerId: user.id,
          store_name: sellerProfile.store_name!,
          variants: { create: productData.variants },
          media: { create: productData.media.map((m: any) => ({ ...m, sellerId: user.id })) },
          category: { create: [{ category: { connectOrCreate: { where: { name: productData.category }, create: { name: productData.category } } } }] },
          tags: { create: productData.tags.map((tag: string) => ({ tag: { connectOrCreate: { where: { name: tag }, create: { name: tag } } } })) },
        },
      });
    }

    return { success: true, count: body.products.length };

  } catch (error: any) {
    console.error('Error creating product batch:', error);
    // This will now catch an error on a specific product and report it.
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create product batch.',
      message: error.message,
    });
  } finally {
    await prisma.$disconnect();
  }
});