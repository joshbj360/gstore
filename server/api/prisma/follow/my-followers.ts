import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';

/**
 * @description Securely fetches a list of all seller IDs that the
 * currently authenticated user is following.
 */
export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({ statusCode: 401, message: 'Unauthorized' });
    }

    try {
        const follows = await prisma.follow.findMany({
            where: {
                followerId: user.id,
            },
            // We only need to return the ID of the seller they are following
            select: {
                followingId: true,
            }
        });

        // The store action is designed to map this, so we return the list directly.
        return follows;

    } catch (error) {
        console.error("Error fetching user follows:", error);
        throw createError({ statusCode: 500, message: "Could not load following list." });
    }
});
