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

    const { name, rates } = await readBody(event);
    if (!name) throw createError({ statusCode: 400, message: 'Profile name is required.' });

    return await prisma.shippingZone.create({
        data: {
            name,
            sellerId: sellerProfile.id,
            rates: {
                create: rates.map((rate: { countries: string[] | string, cost: number }) => ({
                    // This robustly handles both array and comma-separated string inputs
                    countries: Array.isArray(rate.countries) ? rate.countries : (rate.countries?.split(',').map(c => c.trim()) || []),
                    cost: rate.cost
                }))
            }
        }
    });
});