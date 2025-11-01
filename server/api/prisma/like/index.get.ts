import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';

/**
 * @description Securely fetches all product, comment, and post likes
 * for the currently authenticated user. This is used to
 * populate the likeStore when the app initializes.
 */
export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({ statusCode: 401, message: 'Unauthorized' });
    }

    try {
        // We fetch all three types of likes in parallel for maximum performance
        const [productLikes, commentLikes, postLikes] = await Promise.all([
            // 1. Fetch all product likes for this user
            prisma.like.findMany({
                where: { userId: user.id },
                select: {
                    productId: true // We only need the ID
                }
            }),
            // 2. Fetch all comment likes for this user
            prisma.commentLike.findMany({
                where: { userId: user.id },
                select: {
                    commentId: true // We only need the ID
                }
            }),
            // 3. THE FIX: Fetch all post likes for this user
            prisma.postLike.findMany({
                where: { userId: user.id },
                select: {
                    postId: true // We only need the ID
                }
            })
        ]);

        return {
            productLikes,
            commentLikes,
            postLikes // Now included in the response
        };

    } catch (error) {
        console.error("Error fetching user likes:", error);
        throw createError({ statusCode: 500, message: "Could not load user likes." });
    }
});

