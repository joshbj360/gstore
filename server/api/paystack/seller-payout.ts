import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { profileId: user.id },
        include: { wallet: true }
    });
    if (!sellerProfile || !sellerProfile.wallet) {
        throw createError({ statusCode: 403, message: 'Seller profile or wallet not found' });
    }

    const { amount, bankDetails } = await readBody(event);

    if (!amount || amount <= 0) {
        throw createError({ statusCode: 400, message: 'A valid payout amount is required.' });
    }

    if (amount > sellerProfile.wallet.balance) {
        throw createError({ statusCode: 400, message: 'Payout amount exceeds your available balance.' });
    }

    try {
        const payout = await prisma.$transaction(async (tx) => {
            // 1. Debit the seller's wallet
            await tx.sellerWallet.update({
                where: { id: sellerProfile.wallet!.id },
                data: { balance: { decrement: amount } }
            });

            // 2. Create a Transaction record
            await tx.transaction.create({
                data: {
                    walletId: sellerProfile.wallet!.id,
                    amount: -amount, // Payouts are negative transactions
                    type: 'PAYOUT_REQUEST',
                    description: `Payout request for ${amount / 100} NGN`
                }
            });
            
            // 3. Create the Payout record
            const newPayout = await tx.payout.create({
                data: {
                    walletId: sellerProfile.wallet!.id,
                    amount: amount,
                    status: 'PENDING',
                    bank_account: bankDetails // IMPORTANT: Encrypt this in a real application
                }
            });

            return newPayout;
        });

        // In a real app, you would now trigger a notification to your admin team.
        return { success: true, message: 'Payout request submitted successfully.', payout };
        
    } catch (error) {
        console.error("Payout request failed:", error);
        throw createError({ statusCode: 500, message: "Could not process your payout request." });
    }
});
