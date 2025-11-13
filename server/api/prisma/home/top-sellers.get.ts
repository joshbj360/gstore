import prisma from '~/server/prisma/prismaClient';

export default defineEventHandler(async (event) => {
    try {
 // Get top sellers (e.g., by follower count)
            const topSellers = await prisma.sellerProfile.findMany({
                orderBy: { followers_count: 'desc' },
                take: 5,
                select: { 
                    id: true,
                    store_name: true, 
                    store_slug: true, 
                    store_logo: true, 
                    _count: { select: { products: { where: { status: 'PUBLISHED' } } } }
                }
            })
            return topSellers
        } catch (error) {
        console.error("Error fetching homepage data:", error);
        throw createError({ statusCode: 500, message: "Could not load homepage data." });
        }
    })