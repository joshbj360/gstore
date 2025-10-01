import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';
import { z } from 'zod';

const bodySchema = z.object({
  variantId: z.number().positive(),
});

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' });
    
    const validation = await readValidatedBody(event, bodySchema.safeParse);
    if (!validation.success) throw createError({ statusCode: 400, message: 'Invalid request body' });

    const { variantId } = validation.data;

    return await prisma.cartItem.delete({
        where: { userId_variantId: { userId: user.id, variantId } },
    });
});