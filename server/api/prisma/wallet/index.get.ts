import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { profileId: user.id },
    });
    if (!sellerProfile) throw createError({ statusCode: 403, message: 'Seller profile not found' });

    // Find the seller's wallet, and if it doesn't exist, create one.
    const wallet = await prisma.sellerWallet.upsert({
        where: { sellerId: sellerProfile.id },
        update: {},
        create: { sellerId: sellerProfile.id },
        include: {
            transactions: {
                orderBy: { created_at: 'desc' },
                take: 20 // Get the 20 most recent transactions
            }
        }
    });

    return wallet;
});