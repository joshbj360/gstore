import prisma from '~/server/prisma/prismaClient';
import { ProductStatus } from '@prisma/client';

/**
 * @description Fetches a short list of "Hot Accessories" for the homepage sidebar.
 * This is defined as products that are PUBLISHED and flagged as an Accessory.
 * This endpoint is cached for 10 minutes to ensure high performance.
 */
export default defineCachedEventHandler(async (event) => {
    try {
        const accessories = await prisma.products.findMany({
            where: {
                status: ProductStatus.PUBLISHED,
                isAccessory: true,
            },
            select: {
                id: true,
                title: true,
                slug: true,
                price: true,
                media: {
                    take: 1,
                    select: { url: true, public_id: true }
                }
            },
            orderBy: {
                // You can customize this logic, e.g., order by likes or sold count
                soldCount: 'desc'
            },
            take: 4, // Limit to 4 accessories for the sidebar
        });

        return accessories;

    } catch (error) {
        console.error("Error fetching hot accessories:", error);
        throw createError({ statusCode: 500, message: "Could not load accessories." });
    }
}, {
    maxAge: 600 // Cache for 10 minutes
});
