import prisma from '~/server/prisma/prismaClient';
import { z } from 'zod';

const querySchema = z.object({
  query: z.string().min(2, 'Search query must be at least 2 characters long.'),
});

// A public, cached endpoint to search all products for tagging
export default defineCachedEventHandler(async (event) => {
    const queryParams = getQuery(event);
    const validation = querySchema.safeParse(queryParams);
    if (!validation.success) return [];
    
    const searchQuery = validation.data.query;

    try {
        const products = await prisma.products.findMany({
            where: {
                title: { contains: searchQuery, mode: 'insensitive' },
                status: 'PUBLISHED',
            },
            select: { id: true, title: true },
            take: 5,
        });
        return products;
    } catch (error) {
        console.error("Error searching all products:", error);
        return [];
    }
}, { maxAge: 60 });
