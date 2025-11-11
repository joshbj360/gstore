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

    const { id, name, rates } = await readBody(event);
    if (!id) throw createError({ statusCode: 400, message: 'Zone ID is required for an update.' });

    // Use a transaction to ensure the update is atomic
    return await prisma.$transaction(async (tx) => {
        // First, delete all existing rates for this zone
        await tx.zoneRate.deleteMany({ where: { zoneId: id } });

        // Then, update the zone and create the new rates
        const updatedZone = await tx.shippingZone.update({
            where: { 
                id: id,
                sellerId: sellerProfile.id // Security check: ensures a seller can only update their own zones
            },
            data: {
                name,
                rates: {
                    create: rates.map((rate: { countries: string[] | string, cost: number }) => ({
                        countries: Array.isArray(rate.countries) ? rate.countries : (rate.countries?.split(',').map(c => c.trim()) || []),
                        cost: rate.cost
                    }))
                }
            }
        });

        return updatedZone;
    });
});