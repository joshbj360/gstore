import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { profileId: user.id },
        select: { id: true }
    });
    if (!sellerProfile) throw createError({ statusCode: 403, message: 'Seller profile not found' });

    const { id } = await readBody(event);
    if (!id) throw createError({ statusCode: 400, message: 'Zone ID is required.' });

    // Prisma's cascading delete will automatically remove the related ZoneRates
    await prisma.shippingZone.delete({
        where: {
            id: id,
            sellerId: sellerProfile.id // Security check
        }
    });

    return { success: true, message: 'Shipping profile deleted.' };
});