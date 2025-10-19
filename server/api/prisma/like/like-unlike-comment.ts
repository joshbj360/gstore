import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';
import { z } from 'zod';

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
            await prisma.commentLike.delete({ where: { userId_commentId: likeId } });
            return { liked: false };
        } else {
            await prisma.commentLike.create({ data: likeId });
            return { liked: true };
        }
    } catch (error) {
        console.error("Error toggling comment like:", error);
        throw createError({ statusCode: 500, message: 'Could not update like status.' });
    }
});
