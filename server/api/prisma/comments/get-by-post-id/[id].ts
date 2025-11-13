import prisma from '~/server/prisma/prismaClient';
import { z } from 'zod';

/**
 * @description Fetches all top-level comments for a given POST ID,
 * including the author's profile information and counts for likes and replies.
 */
export default defineEventHandler(async (event) => {
    const postId: string = event.context.params!.id;

    // Validate that the ID is a UUID (which Post IDs are)
    const validation = z.string().uuid().safeParse(postId);
    if (!validation.success) {
        throw createError({ statusCode: 400, message: 'Invalid Post ID.' });
    }

    try {
        const comments = await prisma.comment.findMany({
            where: {
                postId: postId,
                parentId: null, // Only fetch top-level comments
            },
            include: {
                 author: { // Include the author's public profile for display
                    select: {
                        username: true,
                        avatar: true,
                    }
                },
                _count: { // Efficiently count related records
                    select: {
                         replies: true,
                        likes: true,
                    }
                },
                 replies: { // Also fetch the replies for this comment
                    include: {
                        author: { select: { username: true, avatar: true } },
                        _count: { select: { likes: true } },
                    },
                    orderBy: {
                        created_at: 'asc' // Show replies in chronological order
                     }
                }
            },
            orderBy: {
                created_at: 'desc' // Show newest top-level comments first
            }
        });
        return comments;
    } catch (error) {
         console.error("Error fetching comments for post:", error);
        throw createError({ statusCode: 500, message: 'Could not fetch comments.' });
    }
});