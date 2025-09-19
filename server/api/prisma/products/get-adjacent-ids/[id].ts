// server/api/prisma/products/get-adjacent-ids/[id].ts

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const productId = parseInt(event.context.params!.id, 10);

  if (isNaN(productId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid product ID',
    });
  }

  try {
    const currentProduct = await prisma.products.findUnique({
      where: { id: productId },
      select: { created_at: true, category: { select: { categoryId: true } } },
    });

    if (!currentProduct) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Product not found',
      });
    }

    const categoryId = currentProduct.category[0]?.categoryId;

    const whereCondition = categoryId 
        ? { category: { some: { categoryId } } } 
        : {};

    const [prevProduct, nextProduct] = await Promise.all([
      // Find the previous product (created earlier)
      prisma.products.findFirst({
        where: {
          ...whereCondition,
          created_at: {
            lt: currentProduct.created_at,
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        select: { id: true },
      }),
      // Find the next product (created later)
      prisma.products.findFirst({
        where: {
            ...whereCondition,
          created_at: {
            gt: currentProduct.created_at,
          },
        },
        orderBy: {
          created_at: 'asc',
        },
        select: { id: true },
      }),
    ]);

    return {
      prev: prevProduct?.id || null,
      next: nextProduct?.id || null,
    };
  } catch (error: any) {
    console.error('Failed to fetch adjacent product IDs:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Could not fetch adjacent products',
    });
  }
});