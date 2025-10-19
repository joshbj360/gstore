import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';
import { z } from 'zod';

const likeSchema = z.object({ productId: z.number() });

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) throw createError({ statusCode: 401, message: 'You must be logged in to like a product.' });

    const validation = await readValidatedBody(event, body => likeSchema.safeParse(body));
    if (!validation.success) {
        throw createError({ statusCode: 400, message: 'Invalid product ID.' });
    }
    const { productId } = validation.data;

    const likeId = { userId: user.id, productId: productId };

    try {
        const existingLike = await prisma.like.findUnique({ where: { userId_productId: likeId } });

        if (existingLike) {
            // If the like exists, delete it (unlike)
            await prisma.like.delete({ where: { userId_productId: likeId } });
            return { liked: false };
        } else {
            // If it doesn't exist, create it (like)
            await prisma.like.create({ data: likeId });
            return { liked: true };
        }
    } catch (error) {
        console.error("Error toggling product like:", error);
        throw createError({ statusCode: 500, message: 'Could not update like status.' });
    }
});
