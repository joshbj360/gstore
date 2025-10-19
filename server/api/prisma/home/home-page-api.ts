import prisma from '~/server/prisma/prismaClient';

export default defineEventHandler(async (event) => {
    try {
        // Fetch all data in parallel for maximum performance
        const [stories, featuredProducts, products, topSellers, hotAccessories] = await Promise.all([
            // Get active stories from the last 24 hours
            prisma.story.findMany({
                where: { expiresAt: { gt: new Date() } },
                include: { 
                    seller: { select: { store_name: true, store_slug: true, store_logo: true } }, 
                    media: true 
                },
                orderBy: { created_at: 'desc' },
                take: 10,
            }),
            // Get products flagged as "featured"
            prisma.products.findMany({
                where: { isFeatured: true, status: 'PUBLISHED' },
                include: { media: true },
                take: 5,
            }),
            // Get the main product feed ("Fresh Drops")
            prisma.products.findMany({
                where: { status: 'PUBLISHED', isAccessory: false }, // Exclude accessories from main feed
                include: { 
                    media: true, 
                    seller: { select: { store_name: true, store_slug: true, store_logo: true, is_verified: true } }, 
                    likes: true 
                },
                orderBy: { created_at: 'desc' },
                take: 10,
            }),
            // Get top sellers (e.g., by follower count)
            prisma.sellerProfile.findMany({
                orderBy: { followers_count: 'desc' },
                take: 5,
                select: { 
                    store_name: true, 
                    store_slug: true, 
                    store_logo: true, 
                    _count: { select: { products: true } }
                }
            }),
            // Get products from the "Accessories" category or flagged as isAccessory
            prisma.products.findMany({
                where: {
                    status: 'PUBLISHED',
                    isAccessory: true,
                },
                include: { media: true },
                take: 4,
            })
        ]);

        return { stories, featuredProducts, products, topSellers, hotAccessories };

    } catch (error) {
        console.error("Error fetching homepage data:", error);
        throw createError({ statusCode: 500, message: "Could not load homepage data." });
    }
});

