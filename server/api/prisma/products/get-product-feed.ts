import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const { productId, category, limit = 5 } = getQuery(event);
  const mainProductId = Number(productId);

  if (isNaN(mainProductId)) {
    throw createError({ statusCode: 400, message: 'A valid productId is required' });
  }

  try {
    const mainProduct = await prisma.products.findUnique({
      where: { id: mainProductId },
      include: { media: true, category: { include: { category: true } }, tags: { include: { tag: true } } }
    });

    if (!mainProduct) {
      throw createError({ statusCode: 404, message: 'Product not found' });
    }
    
    const whereClause: any = category ? {
        category: { some: { category: { name: category as string } } }
    } : {};

    const [productsBefore, productsAfter] = await Promise.all([
      prisma.products.findMany({
        where: { ...whereClause, created_at: { lt: mainProduct.created_at } },
        orderBy: { created_at: 'desc' },
        take: Math.floor(Number(limit) / 2),
        include: { media: true, category: { include: { category: true } }, tags: { include: { tag: true } } },
      }),
      prisma.products.findMany({
        where: { ...whereClause, created_at: { gt: mainProduct.created_at } },
        orderBy: { created_at: 'asc' },
        take: Math.floor(Number(limit) / 2),
        include: { media: true, category: { include: { category: true } }, tags: { include: { tag: true } } },
      }),
    ]);

    return [...productsBefore.reverse(), mainProduct, ...productsAfter];
    
  } catch (error) {
    console.error('Error fetching product feed:', error);
    throw createError({ statusCode: 500, message: 'Could not fetch product feed' });
  }
});