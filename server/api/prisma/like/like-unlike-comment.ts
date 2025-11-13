import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';
import { z } from 'zod';
// THE FIX: Import the NotificationType enum
import { NotificationType } from '@prisma/client';

const likeSchema = z.object({ commentId: z.string().uuid() });

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) throw createError({ statusCode: 401, message: 'You must be logged in to like a comment.' });

    const validation = await readValidatedBody(event, body => likeSchema.safeParse(body));
    if (!validation.success) {
        throw createError({ statusCode: 400, message: 'Invalid comment ID.' });
    }
    const { commentId } = validation.data;

    const likeId = { userId: user.id, commentId: commentId };

    try {
        const existingLike = await prisma.commentLike.findUnique({ where: { userId_commentId: likeId } });

        if (existingLike) {
             // --- UNLIKE ---
            await prisma.commentLike.delete({ where: { userId_commentId: likeId } });
            return { liked: false };
        } else {
             // --- LIKE ---
            // THE FIX: Use a transaction to create the like AND the notification
            await prisma.$transaction(async (tx) => {
                // 1. Create the like
                await tx.commentLike.create({ data: likeId });

                // 2. Find the comment's author
                const comment = await tx.comment.findUnique({
                    where: { id: commentId },
                    select: { authorId: true, text: true, productId: true }
                });

                // 3. Create the notification (if not liking your own comment)
                if (comment && comment.authorId !== user.id) {
                    await tx.notification.create({
                        data: {
                            userId: comment.authorId, // The comment author is the recipient
                            actorId: user.id,        // The user who liked is the actor
                            type: NotificationType.COMMENT_LIKE,
                            message: `${user.user_metadata.username || 'Someone'} liked your comment: "${comment.text.substring(0, 30)}..."`,
                            productId: comment.productId, // So the notification can link to the product
                            commentId: commentId
                        }
                    });
                }
            });
            return { liked: true };
        }
    } catch (error) {
        console.error("Error toggling comment like:", error);
        throw createError({ statusCode: 500, message: 'Could not update like status.' });
    }
});