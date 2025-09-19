import prisma from '~/server/prisma/prismaClient'

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const productId = event.context.params?.id;

  if (!productId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product ID is required",
    });
  }

  // try {
    // Update the product
    const updatedProduct = await prisma.products.update({
      where: { id: parseInt(productId) }, // Identify the product to update
      data: {
        title: body.title,
        description: body.description,
        price: body.price,
        stock: body.stock,
        slug: body.slug,
        status: body.status,
        updated_at: new Date(), // Update the `updated_at` field

        // Handle category
        category: body.category
          ? {
              deleteMany: {}, // Remove existing category relationships
              create: {
                category: {
                  connectOrCreate: {
                    where: { name: body.category.name }, // Connect if the category exists
                    create: { name: body.category.name, thumbnailUrl: body.category.thumbnailUrl }, // Create if the category doesn't exist
                  },
                },
              },
            }
          : undefined,

        // Handle tags
        tags: body.tags
          ? {
              deleteMany: {}, // Remove existing tag relationships
              create: body.tags.map((tag: string) => ({
                tag: {
                  connectOrCreate: {
                    where: { name: tag }, // Connect if the tag exists
                    create: { name: tag }, // Create if the tag doesn't exist
                  },
                },
              })),
            }
          : undefined,

        // Handle media
        media: body.media
          ? {
              deleteMany: {}, // Remove existing media
              create: body.media.map((mediaItem: any) => ({
                url: mediaItem.url,
                thumbnailUrl: mediaItem.thumbnailUrl,
                altText: mediaItem.altText,
                type: mediaItem.type,
              })),
            }
          : undefined,
      },
      include: {
        category: {
          include: {
            category: true, // Include the category details
          },
        },
        tags: {
          include: {
            tag: true, // Include the tag details
          },
        },
        media: true, // Include the media details
      },
    });

    return updatedProduct;
  // } catch (error) {
  //   console.error("Failed to update product:", error);
  //   throw createError({
  //     statusCode: 500,
  //     statusMessage: "Failed to update product",
  //   });
  // }
});