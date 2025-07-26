// server/api/products/[id]/similar.get.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const productId = event.context.params?.id;

  // Validate product ID
  if (!productId || isNaN(parseInt(productId))) {
    throw createError({
      statusCode: 400,
      statusMessage: "Valid product ID is required",
    });
  }

  // try {
    // Get current product with minimal needed relations
    const currentProduct = await prisma.products.findUnique({
      where: { id: parseInt(productId) },
      select: {
        id: true,
        category: { select: { categoryId: true } },
        tags: { select: { tag: { select: { name: true } } } },
      },
    });

    if (!currentProduct) {
      throw createError({
        statusCode: 404,
        statusMessage: "Product not found",
      });
    }

    const categoryIds = currentProduct.category.map(c => c.categoryId);
    const tagNames = currentProduct.tags.map(t => t.tag.name);

    if (categoryIds.length === 0 && tagNames.length === 0) {
      return [];
    }

    // Main query using Prisma's fluent API with optimized joins
    const similarProducts = await prisma.products.findMany({
      where: {
        AND: [
          { id: { not: parseInt(productId) } },
          {
            OR: [
              ...(categoryIds.length > 0 ? [{
                category: {
                  some: {
                    categoryId: { in: categoryIds }
                  }
                }
              }] : []),
              ...(tagNames.length > 0 ? [{
                tags: {
                  some: {
                    tag: {
                      name: { in: tagNames }
                    }
                  }
                }
              }] : [])
            ]
          }
        ]
      },
      orderBy: [
        // Prioritize products with more category matches
        {
          category: {
            _count: 'desc'
          }
        },
        // Then prioritize products with more tag matches
        {
          tags: {
            _count: 'desc'
          }
        },
        // Finally sort by newest
        {
          created_at: 'desc'
        }
      ],
      take: 8,
      include: {
        media: { take: 1 },
        category: {
          include: {
            category: true
          }
        }
      }
    });

    return similarProducts;

  // } catch (error) {
  //   console.error("Failed to get similar products:", error);
  //   throw createError({
  //     statusCode: 500,
  //     statusMessage: "Failed to get similar products",
  //   });
  // } finally {
  //   await prisma.$disconnect();
  // }
});