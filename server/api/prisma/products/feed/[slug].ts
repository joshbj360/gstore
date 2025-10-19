import { IProduct } from '~/models';
import prisma from '~/server/prisma/prismaClient';

export default defineEventHandler(async (event) => {
  const slug = event.context.params?.slug;
  if (!slug) throw createError({ statusCode: 400, message: 'Product slug is required' });

  try {
    const mainProduct = await prisma.products.findUnique({
      where: { slug },
      include: { 
        media: true, 
        variants: true, 
        // THE FIX: We now explicitly include the related seller's profile data.
        seller: {
          select: {
            store_slug: true,
            store_name: true,
            store_logo: true,
            is_verified: true,
            followers_count: true
          }
        }
      }
    });

    if (!mainProduct) throw createError({ statusCode: 404, message: 'Product not found' });

    // Fetch related products (e.g., from the same category)
    const categoryId = (await prisma.productCategories.findFirst({ where: { productId: mainProduct.id } }))?.categoryId;
    let relatedProducts: IProduct[] = [];

    if (categoryId) {
        const productsInCategory = await prisma.productCategories.findMany({
            where: { categoryId: categoryId, NOT: { productId: mainProduct.id } },
            take: 10,
            include: { 
              product: { 
                include: { 
                  media: true, 
                  variants: true,
                  // Also include seller data for the related products
                  seller: {
                    select: {
                      store_slug: true,
                      store_logo: true,
                      is_verified: true,
                      followers_count: true
                    }
                  }
                } 
              } 
            }
        });
        relatedProducts = productsInCategory.map(pc => pc.product) as IProduct[];
    }
    
    const feed = [mainProduct, ...relatedProducts];
    return feed;

  } catch (error) {
    console.error(`Error fetching product feed for slug "${slug}":`, error);
    throw createError({ statusCode: 500, message: 'Could not fetch product feed' });
  }
});
