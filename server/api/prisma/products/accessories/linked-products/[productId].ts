import prisma from '~/server/prisma/prismaClient';
import { z } from 'zod';

export default defineEventHandler(async (event) => {
    const productId = parseInt(event.context.params!.id, 10);
    if (isNaN(productId)) {
        throw createError({ statusCode: 400, message: 'Invalid Product ID.' });
    }

    try {
        // 1. Find all relations where this product is the "main look"
        const relations = await prisma.productRelation.findMany({
            where: { styledWithId: productId },
            select: { appearsInId: true } // Get the IDs of the accessories
        });

        const accessoryIds = relations.map(r => r.appearsInId);
        if (accessoryIds.length === 0) {
            return []; // No accessories linked
        }

        // 2. Fetch the full product data for those accessories
        const accessories = await prisma.products.findMany({
            where: {
                id: { in: accessoryIds },
                status: 'PUBLISHED'
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
        console.error("Error fetching linked accessories:", error);
        throw createError({ statusCode: 500, message: 'Could not load accessories.' });
    }
});
