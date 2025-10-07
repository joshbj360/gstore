import prisma from '~/server/prisma/prismaClient'; // Use our singleton prisma client

export default defineEventHandler(async (event) => {
  const slug = event.context.params?.slug;

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: "Store slug is required",
    });
  }

  try {
    const products = await prisma.products.findMany({
      where: {
        // THE FIX: This is the correct way to query through a relation.
        // It finds products where the related 'seller' model's 'store_slug' matches.
        seller: {
          store_slug: slug,
        },
        // It's also good practice to only show published products on a public store page
        status: 'PUBLISHED',
      },
      include: {
        media: true,
        variants: true,
        // You can include other relations if needed for your ProductCard
      },
      orderBy: {
          created_at: 'desc'
      }
    });

    if (!products) {
        // Even if the seller exists but has no products, return an empty array
        return [];
    }

    return products;

  } catch (error) {
    console.error(`Error fetching products for store slug "${slug}":`, error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
