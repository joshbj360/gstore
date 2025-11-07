import prisma from '~/server/prisma/prismaClient';
import { z } from 'zod';
import { ProductStatus } from '@prisma/client';

/**
 * @description Fetches all linked "Shop the Look" accessories for a given product.
 * This endpoint is cached for 10 minutes.
 */
export default defineCachedEventHandler(async (event) => {
    
    // 1. Validate the incoming product ID
    const id = event.context.params!.id;

    try {
        // 2. Find all relations where this product is the "main look"
        const relations = await prisma.productRelation.findMany({
            where: { styledWithId: parseInt(id) },
            select: { appearsInId: true } // Get the IDs of the accessories
        });

        const accessoryIds = relations.map(r => r.appearsInId);
        if (accessoryIds.length === 0) {
            return []; // No accessories linked
        }

        // 3. Fetch the full product data for those accessories
        const accessories = await prisma.products.findMany({
            where: {
                id: { in: accessoryIds },
                status: ProductStatus.PUBLISHED
            },
            select: {
                id: true,
                title: true,
                slug: true,
                price: true,
                media: { take: 1, select: { url: true } }
            }
        });

        return accessories;

    } catch (error: any) {
        // 4. Robust error handling
        console.error("Error fetching linked accessories:", error);
        throw createError({ statusCode: 500, message: 'Could not load accessories.' });
    }
}, {
    maxAge: 600 // Cache for 10 minutes
});