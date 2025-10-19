import prisma from '~/server/prisma/prismaClient';

/**
 * @description A secure endpoint designed to be called by a scheduled job (cron).
 * It finds and deletes all stories that have passed their expiration date.
 */
export default defineEventHandler(async (event) => {
    // SECURITY: Protect the endpoint with a secret key
    const cronSecret = getHeader(event, 'x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
        throw createError({ statusCode: 401, message: 'Unauthorized' });
    }

    try {
        const now = new Date();
        const { count } = await prisma.story.deleteMany({
            where: {
                expiresAt: {
                    lt: now // "lt" means less than
                }
            }
        });

        console.log(`Cron Job: Deleted ${count} expired stories.`);
        return { success: true, deletedCount: count };

    } catch (error) {
        console.error("Cron Job Error: Failed to delete expired stories:", error);
        throw createError({ statusCode: 500, message: "Error during cron job execution." });
    }
});
