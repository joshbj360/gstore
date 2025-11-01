import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';
import { z } from 'zod';
import { NotificationType } from '@prisma/client';

const likeSchema = z.object({
    postId: z.string().uuid(),
});

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) throw createError({ statusCode: 401, message: 'You must be logged in.' });

    const validation = await readValidatedBody(event, body => likeSchema.safeParse(body));
    if (!validation.success) {
        throw createError({ statusCode: 400, message: 'Invalid Post ID.' });
    }
    const { postId } = validation.data;
    const likeId = { userId: user.id, postId: postId };

    try {
        const existingLike = await prisma.postLike.findUnique({ where: { userId_postId: likeId } });

        if (existingLike) {
            // --- UNLIKE ---
            await prisma.postLike.delete({ where: { userId_postId: likeId } });
            return { liked: false };
        } else {
            // --- LIKE ---
            await prisma.$transaction(async (tx) => {
                // 1. Create the like
                await tx.postLike.create({ data: likeId });

                // 2. Get the post author
                const post = await tx.post.findUnique({
                    where: { id: postId },
                    select: { authorId: true }
                });

                // 3. Create a notification for the author (if they aren't liking their own post)
                if (post && post.authorId !== user.id) {
                    await tx.notification.create({
                        data: {
                            userId: post.authorId, // The recipient
                            actorId: user.id,      // The person who liked
                            type: 'COMMENT_LIKE',  // You can reuse this or add POST_LIKE
                            message: `${user.user_metadata.username || 'Someone'} liked your post.`,
                            // You would add a postId link to your Notification model
                        }
                    });
                }
            });
            return { liked: true };
        }
    } catch (error) {
        console.error("Error toggling post like:", error);
        throw createError({ statusCode: 500, message: 'Could not update like status.' });
    }
});
