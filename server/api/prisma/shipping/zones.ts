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

    const body = await readBody(event);
    const { id, name, rates } = body;

    // This single endpoint handles both CREATE and UPDATE
    const data = {
        name,
        sellerId: sellerProfile.id,
        rates: {
            // Delete old rates and create new ones to ensure consistency
            deleteMany: {},
            create: rates.map((rate: { countries: string[] | string, cost: number }) => ({
                countries: Array.isArray(rate.countries) ? rate.countries : (typeof rate.countries === 'string' ? rate.countries.split(',').map(c => c.trim()) : []),
                cost: rate.cost
            }))
        }
    };

    if (id) {
        // Update existing zone
        return await prisma.shippingZone.update({
            where: { id, sellerId: sellerProfile.id }, // Security check
            data,
        });
    } else {
        // Create new zone
        return await prisma.shippingZone.create({ data });
    }
});
