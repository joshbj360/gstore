import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';

/**
 * @description Securely fetches the seller's wallet.
 * If a wallet doesn't exist, it creates one.
 * It also includes the 10 most recent transactions.
 */
export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { profileId: user.id },
        select: { id: true }
    });
    if (!sellerProfile) throw createError({ statusCode: 403, message: 'Seller profile not found' });

    try {
        // Use upsert to find the wallet or create it if it's the seller's first time.
        const wallet = await prisma.sellerWallet.upsert({
            where: { sellerId: sellerProfile.id },
            update: {}, // No updates needed, just fetch
            create: { sellerId: sellerProfile.id },
            include: {
                transactions: {
                    orderBy: { created_at: 'desc' },
                    take: 10 // Get the 10 most recent transactions
                }
            }
        });
        return wallet;
    } catch (error) {
        console.error("Error fetching seller wallet:", error);
        throw createError({ statusCode: 500, message: 'Could not load wallet data.' });
    }
});
