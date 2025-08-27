import type { MediaInterface } from '~/models/interface/products/media.interface';
import type { ProductInterface } from '~/models/interface/products/product.interface';
import { serverSupabaseUser } from '#supabase/server';

import prisma from '~/server/prisma/prismaClient'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const body = await readBody<ProductInterface & { variants?: { size: string, stock: number }[] }>(event);

  // --- UPDATED VALIDATION ---
  if (!body.title?.trim() || !body.price) {
    throw createError({ statusCode: 400, message: 'Title and price are required' });
  }
  if (!body.variants || body.variants.length === 0 || body.variants.some(v => !v.size || v.stock == null)) {
      throw createError({ statusCode: 400, message: 'At least one product variant with a size and stock is required' });
  }

  try {
    const product = await prisma.products.create({
      data: {
        title: body.title.trim(),
        description: body.description?.trim() || null,
        price: body.price,
        slug: body.slug?.trim() || body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''), // Auto-generate slug if not provided
        sellerId: user.id,
        store_name: body.store_name,
        discount: body.discount || 0,
        
        // --- NEW: Create variants instead of a single stock ---
        variants: {
          create: body.variants.map(variant => ({
            size: variant.size,
            stock: variant.stock,
          })),
        },

        // Category handling remains the same
        category: body.category ? {
          create: [{
            category: {
              connectOrCreate: {
                where: { name: body.category.name.trim() },
                create: {
                  name: body.category.name.trim(),
                  thumbnailCatUrl: body.category.thumbnailCatUrl ?? null,
                },
              },
            },
          }],
        } : undefined,

        // Tags handling remains the same
        tags: body.tags ? {
          create: body.tags.map(tag => ({
            tag: {
              connectOrCreate: {
                where: { name: tag.name.trim() },
                create: { name: tag.name.trim() },
              },
            },
          })),
        } : undefined,

        // Media handling remains the same
        media: body.media ? {
          create: body.media.map((mediaItem: MediaInterface) => ({
            url: mediaItem.url,
            type: mediaItem.type,
            sellerId: mediaItem.sellerId || user.id, // Use sellerId from media or fallback to user id
          })),
        } : undefined,
      },

      // --- UPDATED INCLUDE: Return the new variants in the response ---
      include: {
        category: { include: { category: true } },
        tags: { include: { tag: true } },
        media: true,
        variants: true, // Include variants in the returned product data
      },
    });

    return product;
  } catch (error) {
    console.error('Error creating product:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Could not create product',
    });
  } finally {
    await prisma.$disconnect();
  }
});