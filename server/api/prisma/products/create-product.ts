import { PrismaClient, $Enums } from '@prisma/client';
import { MediaInterface } from '~/models/interface/products/media.interface';
import type { ProductInterface } from '~/models/interface/products/product.interface';
import { serverSupabaseUser } from '#supabase/server';
import { th } from '@faker-js/faker';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  // Authenticate user
  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const body = await readBody<ProductInterface>(event);

  // Basic validation
  if (!body.title?.trim() || !body.price || !body.slug?.trim()) {
    throw createError({ statusCode: 400, message: 'Title, price, and slug are required' });
  }

  try {
    const product = await prisma.products.create({
      data: {
        title: body.title.trim(),
        description: body.description?.trim() || null,
        price: body.price,
        stock: body.stock ?? null,
        slug: body.slug.trim(),
        sellerId: user.id,
        store_name: body.store_name,

        // Handle category (nested through relation table)
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

        // Handle tags (many-to-many through join table)
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

        // Handle media
        media: body.media ? {
          create: body.media.map((mediaItem: MediaInterface) => ({
            url: mediaItem.url,
            type: mediaItem.type,
          })),
        } : undefined,

        created_at: new Date(),
        updated_at: new Date(),
      },

      include: {
        category: { include: { category: true } },
        tags: { include: { tag: true } },
        media: true,
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
