import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';

/**
 * @description Securely fetches all notifications for the currently authenticated user.
 */
export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({ statusCode: 401, message: 'Unauthorized' });
    }

    try {
        const notifications = await prisma.notification.findMany({
            where: {
                userId: user.id, // Only fetch notifications for the logged-in user
            },
            include: {
                // Include the profile of the person who triggered the notification
                actor: {
                    select: {
                        username: true,
                        avatar: true,
                    }
                }
            },
            orderBy: {
                created_at: 'desc' // Show newest notifications first
            },
            take: 20 // Limit to the 20 most recent notifications
        });

        return notifications;

    } catch (error) {
        console.error("Error fetching notifications:", error);
        throw createError({ statusCode: 500, message: "Could not load notifications." });
    }
});
