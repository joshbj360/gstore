import prisma from '~/server/prisma/prismaClient';
import { Paystack } from 'paystack-sdk';
import crypto from 'crypto';

const paystackSecret = process.env.PAYSTACK_SECRET_KEY!;
if (!paystackSecret) {
    console.error("Paystack secret key is not set in environment variables.");
}
const paystack = new Paystack(paystackSecret);

// Define your platform's commission rate (e.g., 10%)
const PLATFORM_COMMISSION_RATE = 0.10;

export default defineEventHandler(async (event) => {
  const signature = getHeader(event, 'x-paystack-signature');
  const body = await readRawBody(event);
  if (!body) {
      throw createError({ statusCode: 400, message: 'Invalid request body' });
  }

  const hash = crypto.createHmac('sha512', paystackSecret).update(body).digest('hex');
  if (hash !== signature) {
    throw createError({ statusCode: 401, message: 'Invalid Paystack signature' });
  }

  const payload = JSON.parse(body);
  const { event: eventType, data } = payload;

  if (eventType === 'charge.success') {
    const { reference } = data;

    try {
      const verification = await paystack.transaction.verify(reference);

      if (!verification.status || verification.data?.status !== 'success') {
          console.warn(`Paystack verification failed for reference: ${reference}`);
          return { status: 'success' };
      }

      const verifiedData = verification.data;
      const verifiedAmount = verifiedData.amount;

      await prisma.$transaction(async (tx) => {
        const order = await tx.orders.findFirst({
          where: { stripeId: reference },
          include: { 
            orderItem: { 
              include: { 
                variant: { 
                  include: { 
                    product: { 
                      select: { sellerId: true } 
                    } 
                  } 
                } 
              } 
            } 
          }
        });

        if (!order || order.status === 'COMPLETED') {
            console.log(`Order for reference ${reference} not found or already completed.`);
            return;
        }
        
        if (order.totalAmount !== verifiedAmount) {
             console.warn(`Amount mismatch for order ${order.id}. Expected ${order.totalAmount}, got ${verifiedAmount}`);
             return;
        }

        // --- NEW: SELLER WALLET LOGIC ---

        // 1. Group order items by seller
        const earningsBySeller: Record<string, number> = {};
        for (const item of order.orderItem) {
            const sellerId = item.variant.product.sellerId;
            const itemPrice = item.variant.price || 0; // Use a default price if null
            if (!earningsBySeller[sellerId]) {
                earningsBySeller[sellerId] = 0;
            }
            earningsBySeller[sellerId] += itemPrice * item.quantity;
        }

        // 2. For each seller, calculate commission and credit their wallet
        for (const sellerId in earningsBySeller) {
            const totalSale = earningsBySeller[sellerId];
            const commission = totalSale * PLATFORM_COMMISSION_RATE;
            const sellerEarnings = totalSale - commission;

            // Find or create the seller's wallet
            const sellerWallet = await tx.sellerWallet.upsert({
                where: { sellerId: sellerId },
                update: {},
                create: { sellerId: sellerId }
            });
            
            // Credit the seller's wallet
            await tx.sellerWallet.update({
                where: { id: sellerWallet.id },
                data: { balance: { increment: sellerEarnings } }
            });
            
            // Create a transaction record for auditing
            await tx.transaction.create({
                data: {
                    walletId: sellerWallet.id,
                    amount: sellerEarnings,
                    type: 'SALE',
                    orderId: order.id,
                    description: `Earnings from Order #${order.id}`
                }
            });
        }
        
        // 3. Update the order status to COMPLETED
        await tx.orders.update({
          where: { id: order.id },
          data: { status: 'COMPLETED' },
        });
      });
      
    } catch (error) {
      console.error(`Error processing webhook for reference ${reference}:`, error);
      throw createError({ statusCode: 500, message: 'Error updating order' });
    }
  }

  // Acknowledge receipt of the event to Paystack
  return { status: 'success' };
});

