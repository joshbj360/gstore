import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const { id } = event.context.params;

  try {
    const product = await prisma.products.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true, // Include the associated category
        tags: {
          include: {
            tag: true, // Include the associated tags
          },
        },
        media: true, // Include the associated media
      },
    });

    if (!product) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Product not found',
      });
    }

    // Format the response to include tags and media
    const response = {
      ...product,
      tags: product.tags.map((productTag) => productTag.tag), // Extract tag details
      media: product.media, // Include media details
    };

    return response;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch product',
      data: error,
    });
  }
});