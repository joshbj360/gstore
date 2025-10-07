import prisma from '~/server/prisma/prismaClient'

export default defineEventHandler(async (event) => {
  const params = event.context.params;
  if (!params || typeof params.slug !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing or invalid product slug',
    });
  }
  const { slug } = params;

  try {
    const product = await prisma.products.findUnique({
      where: { slug },
      include: {
        category: true, // Include the associated category
        tags: {
          include: {
            tag: true, // Include the associated tags
          },
        },
        media: true, // Include the associated media
        measurement: true, // Include the measurement details
        variants: true, // Include the associated variants
        seller: {
          select: {
            store_slug: true,
            store_logo: true,
            is_verified: true,
            followers_count: true,
          }
        }
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