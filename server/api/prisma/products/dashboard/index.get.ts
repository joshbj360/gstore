import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';

/**
 * @description Securely fetches all products for the currently authenticated seller.
 * This is designed to populate the Seller Dashboard's "Products" tab.
 */
export default defineEventHandler(async (event) => {
    // 1. Get the authenticated user
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({ statusCode: 401, message: 'Unauthorized' });
    }

    // 2. Find the user's seller profile to get their Seller ID
    const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { profileId: user.id },
        select: { id: true }
    });
    if (!sellerProfile) {
        throw createError({ statusCode: 403, message: 'Seller profile not found' });
    }

    try {
        // 3. Fetch all products that belong to this seller
        const products = await prisma.products.findMany({
            where: {
                sellerId: sellerProfile.id
            },
            // 4. Use a specific `select` to fetch ONLY the data the component needs
            select: {
                id: true,
                title: true,
                slug: true,
                price: true,
                status: true,
                soldCount: true,
                media: {
                    select: {
                        url: true
                    },
                    take: 1 // We only need the first image for the thumbnail
                },
                variants: {
                    select: {
                        stock: true // We only need stock to calculate the total
                    }
                },
                _count: {
                    select: {
                        likes: true // Efficiently count the number of likes
                    }
                }
            },
            orderBy: {
                updated_at: 'desc'
            }
        });

        return products;

    } catch (error) {
        console.error("Error fetching seller products:", error);
        throw createError({ statusCode: 500, message: 'Could not fetch products' });
    }
});
