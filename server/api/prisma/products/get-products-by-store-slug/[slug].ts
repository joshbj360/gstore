import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const slug = event.context.params?.slug
  console.log(slug)

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: "Store name is required",
    });
  }

  // try {
    const products = await prisma.products.findMany({
      where: { store_slug: slug },
      include: {
        media: true,
        category: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        measurement: true,
        variants: true, // Include the variants for each product
      },
    });
    console.log('this are products by seller ', products, 'source: [server/products/store_name.ts}')
    return products;
  // } catch (error) {
  //   console.error("Error fetching products by seller ID:", error);
  //   throw createError({
  //     statusCode: 500,
  //     statusMessage: "Internal Server Error",
  //   });
  // }
});


