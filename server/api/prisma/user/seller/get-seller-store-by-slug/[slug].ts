
import prisma from '~/server/prisma/prismaClient';

/**
 * @description Fetches a seller's public profile and all their associated products
 * using their unique store slug. This is a public-facing endpoint.
 */
export default defineEventHandler(async (event) => {
  const slug = event.context.params?.slug;

  if (!slug) {
    throw createError({ statusCode: 400, message: 'Store slug is required' });
  }

  try {
    // This single, efficient query fetches the seller and all their products at once.
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { store_slug: slug },
      include: {
        // We include the products associated with this seller
        products: {
          where: { status: 'PUBLISHED' }, // Only show published products on the public page
          include: {
            media: true,
            variants: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        },
      },
    });

    if (!sellerProfile) {
      throw createError({ statusCode: 404, message: 'Store not found' });
    }

    return sellerProfile;
    
  } catch (error) {
    console.error(`Error fetching seller profile for slug "${slug}":`, error);
    throw createError({ statusCode: 500, message: 'Could not fetch seller profile' });
  }
});
