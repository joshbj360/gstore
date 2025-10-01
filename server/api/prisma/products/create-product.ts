import type { IMedia } from '@/models/interface/';
import type { IProduct } from '@/models/interface/'
import { serverSupabaseUser } from '#supabase/server';

import prisma from '~/server/prisma/prismaClient'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const body = await readBody<IProduct & { variants?: { size: string, stock: number }[] }>(event);

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
        store_name: body.store_slug,
        discount: body.discount || 0,
        
        // --- NEW: Create variants instead of a single stock ---
        variants: {
          create: body.variants.map(variant => ({
            size: variant.size,
            stock: variant.stock,
            price: variant.price || body.price, // Use variant price or fallback to product price 
          })),
        },

        shippingZone: body.shippingZoneId ? {
          connect : { id: body.shippingZoneId}
        } : undefined,

        // Category handling remains the same
        category: body.category ? {
          create: [{
            category: {
              connectOrCreate: {
                where: { name: body.category[0].category.name.trim() },
                create: {
                  name: body.category[0].category.name.trim(),
                  thumbnailCatUrl: body.category[0].category.thumbnailCatUrl ?? null,
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
                where: { name: tag.tag.name.trim() },
                create: { name: tag.tag.name.trim() },
              },
            },
          })),
        } : undefined,

        // Media handling remains the same
        media: body.media ? {
          create: body.media.map((mediaItem: IMedia) => ({
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
        shippingZone: true,
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