import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const slug = event.context.params?.slug;

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Category slug is required',
    });
  }

  try {
    // Find the category by its slug and include its products in the same query
    const categoryWithProducts = await prisma.category.findUnique({
      where: { slug },
      include: {
        products: { // This is the relation to the join table
          include: {
            product: { // From the join table, include the actual product details
              include: {
                media: true,    // Include product media
                variants: true, // Include product variants
              }
            }
          }
        }
      }
    });

    if (!categoryWithProducts) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Category not found',
      });
    }

    // We need to extract the product data from the nested structure
    const products = categoryWithProducts.products.map(p => p.product);

    return {
      category: {
        id: categoryWithProducts.id,
        name: categoryWithProducts.name,
        slug: categoryWithProducts.slug,
        description: categoryWithProducts.thumbnailCatUrl,
      },
      products: products
    };

  } catch (error) {
    console.error(`Error fetching products for category slug "${slug}":`, error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Could not fetch category products',
    });
  }
});
