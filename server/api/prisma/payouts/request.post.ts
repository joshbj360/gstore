import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';
import { z } from 'zod';

// Zod schema for validating the payout request
const payoutSchema = z.object({
  amount: z.number().positive('Payout amount must be positive.'),
  bankDetails: z.object({
    accountNumber: z.string().min(10, 'Invalid account number'),
    bankName: z.string().min(2, 'Invalid bank name'),
    accountName: z.string().min(2, 'Invalid account name'),
  }),
});

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { profileId: user.id },
        include: { wallet: true }
    });
    if (!sellerProfile || !sellerProfile.wallet) {
        throw createError({ statusCode: 403, message: 'Seller wallet not found' });
    }

    const validation = await readValidatedBody(event, body => payoutSchema.safeParse(body));
    if (!validation.success) {
        throw createError({ statusCode: 400, message: validation.error.issues.map(i => i.message).join(', ') });
    }
    
    const { amount, bankDetails } = validation.data;

    // Server-side check to ensure user has enough funds
    if (amount > sellerProfile.wallet.balance) {
        throw createError({ statusCode: 400, message: 'Payout amount exceeds your available balance.' });
    }

    try {
        // Use a transaction to ensure all financial operations are atomic
        const payout = await prisma.$transaction(async (tx) => {
            // 1. Debit the seller's wallet
            await tx.sellerWallet.update({
                where: { id: sellerProfile.wallet!.id },
                data: { balance: { decrement: amount } }
            });

            // 2. Create a Transaction record for auditing
            await tx.transaction.create({
                data: {
                    walletId: sellerProfile.wallet!.id,
                    amount: -amount, // Payouts are a negative transaction
                    type: 'PAYOUT_REQUEST',
                    description: `Payout to ${bankDetails.bankName} (${bankDetails.accountNumber.slice(-4)})`
                }
            });
            
            // 3. Create the Payout record for processing
            const newPayout = await tx.payout.create({
                data: {
                    walletId: sellerProfile.wallet!.id,
                    amount: amount,
                    status: 'PENDING',
                    bank_account: bankDetails as any
                }
            });
            return newPayout;
        });

        // In a real app, this would also trigger a notification to your admin team
        return { success: true, message: 'Payout request submitted successfully.' };
        
    } catch (error) {
        console.error("Payout request failed:", error);
        throw createError({ statusCode: 500, message: "Could not process your payout request." });
    }
});

