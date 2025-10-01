import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';

/**
 * @description Fetches all shipping zones for the currently authenticated seller.
 */
export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({ statusCode: 401, message: 'Unauthorized' });
    }

    const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { profileId: user.id },
        select: { id: true }
    });

    if (!sellerProfile) {
        throw createError({ statusCode: 403, message: 'Seller profile not found' });
    }

    const shippingZones = await prisma.shippingZone.findMany({
        where: { sellerId: sellerProfile.id },
        include: {
            rates: true // Include the rates for each zone
        },
        orderBy: {
            isDefault: 'desc', // Show the default profile first
        }
    });

    return shippingZones;
});

