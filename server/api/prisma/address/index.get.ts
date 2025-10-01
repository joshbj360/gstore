import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const address = await prisma.addresses.findUnique({
        where: { userId: user.id }
    });

    if (!address) {
        return  {}
    }

    return address;
});