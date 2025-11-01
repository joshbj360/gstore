import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';

/**
 * @description Securely fetches all notifications for the currently authenticated user.
 */
export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' });

    try {
        const notifications = await prisma.notification.findMany({
            where: {
                userId: user.id,
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
                created_at: 'desc'
            },
            take: 30 // Limit to the 30 most recent
        });

        // We can also fetch the unread count
        const unreadCount = await prisma.notification.count({
            where: {
                userId: user.id,
                read: false
            }
        });

        return {
            notifications,
            unreadCount
        };

    } catch (error) {
        console.error("Error fetching notifications:", error);
        throw createError({ statusCode: 500, message: "Could not load notifications." });
    }
});

