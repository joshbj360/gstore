import prisma from '~/server/prisma/prismaClient'; // THE FIX: Import the singleton instance

/**
 * @description Fetches all product categories from the database.
 * This endpoint is cached on the server for 1 hour to improve performance
 * and reduce database load, as categories do not change frequently.
 */
export default defineCachedEventHandler(async (event) => {
    try {
        // THE FIX: The database call must be awaited.
        const categories = await prisma.category.findMany({
            orderBy: {
                name: 'asc' // Always return data in a consistent order
            }
        });
        return categories;
        
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not fetch categories',
        });
    }
    // THE FIX: prisma.$disconnect() has been removed as it is not needed here.
}, {
    maxAge: 3600 // Cache the result for 1 hour (3600 seconds)
});
