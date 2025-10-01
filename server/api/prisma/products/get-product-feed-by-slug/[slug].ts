import { IProduct } from '~/models';
import prisma from '~/server/prisma/prismaClient';

export default defineEventHandler(async (event) => {
  const slug = event.context.params?.slug;
  if (!slug || typeof slug == undefined) throw createError({ statusCode: 400, message: 'Product slug is required' });

  try {
    const mainProduct = await prisma.products.findUnique({
      where: { slug },
      include: { media: true, variants: true, category: true, tags: true }
    });

    if (!mainProduct) throw createError({ statusCode: 404, message: 'Product not found' });

    // Fetch related products (e.g., from the same category)
    const categoryId = mainProduct.category[0]?.categoryId;
    let relatedProducts: IProduct[] = [];

    if (categoryId) {
        const productsInCategory = await prisma.productCategories.findMany({
            where: { categoryId: categoryId, NOT: { productId: mainProduct.id } },
            take: 10, // Limit the number of related products
            include: { product: { include: { media: true, variants: true } } }
        });
        relatedProducts = productsInCategory.map(pc => pc.product) as IProduct[]
    }
    
    // The final feed is the main product plus the related ones.
    const feed = [mainProduct, ...relatedProducts];
    return feed;

  } catch (error) {
    console.error(`Error fetching product feed for slug "${slug}":`, error);
    throw createError({ statusCode: 500, message: 'Could not fetch product feed' });
  }
});