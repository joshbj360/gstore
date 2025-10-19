import prisma from '~/server/prisma/prismaClient';

/**
 * @description Fetches all top-level comments for a given product ID,
 * including the author's profile information and counts for likes and replies.
 */
export default defineEventHandler(async (event) => {
    const productId: number = parseInt(event.context.params!.id, 10)

    console.log("Fetching comments for product ID:", productId);

    if (isNaN(productId)) {
        throw createError({ statusCode: 400, message: 'Invalid Product ID.' });
    }

    try {
        const comments = await prisma.comment.findMany({
            where: {
                productId: productId,
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
                replies: {
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
                created_at: 'desc'
            }
        });
        return comments;
    } catch (error) {
        console.error("Error fetching comments:", error);
        throw createError({ statusCode: 500, message: 'Could not fetch comments.' });
    }
});

