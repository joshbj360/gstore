import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';
import { z } from 'zod';

// Define a schema for the query parameters for validation
const querySchema = z.object({
    query: z.string().min(1, 'A search query is required.'),
});

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const queryParams = getQuery(event);
    const validation = querySchema.safeParse(queryParams);

    if (!validation.success) {
        // Return an empty array if there's no query, as it's not an error
        return [];
    }
    const { query } = validation.data;

    console.log('Supabase user:', user?.id);
    console.log('Query params:', getQuery(event));

    const countAll = await prisma.products.count();
    console.log('All products count:', countAll);

    const test = await prisma.products.findMany({ take: 2 });
    console.log('Sample products:', test);

    // This query finds products belonging to the current seller that match the search term
    const products = await prisma.products.findMany({
        where: {
            // sellerId: user.id,
            title: {
                contains: query,
                mode: 'insensitive', // Case-insensitive search
            },
            //status: 'PUBLISHED', // Only allow linking to published products
        },
        select: {
            id: true,
            title: true,
            media: {
                take: 1,
                select: { url: true }
            }
        },
        take: 5, // Limit the number of search results
    });
    const queriedProducts = [...products];
    return queriedProducts;
});
