import prisma from '~/server/prisma/prismaClient';
import crypto from 'crypto';
import { NotificationType } from '@prisma/client';
import { EOrderStatus } from '~/models';

const config = useRuntimeConfig();
const paystackSecret = config.paystackSecretKey;

if (!paystackSecret) {
    console.error("FATAL: PAYSTACK_SECRET_KEY is not configured.");
}

const PLATFORM_COMMISSION_RATE: number = Number(config.platformCommissionRate)

export default defineEventHandler(async (event) => {
  const signature = getHeader(event, 'x-paystack-signature');
  const body = await readRawBody(event);

  if (!body) throw createError({ statusCode: 400, message: 'Invalid request body' });

  const hash = crypto.createHmac('sha512', paystackSecret!).update(body).digest('hex');
  if (hash !== signature) {
    throw createError({ statusCode: 401, message: 'Invalid Paystack signature' });
  }

  const payload = JSON.parse(body);
  const { event: eventType, data } = payload;

  if (eventType === 'charge.success') {
    const { reference } = data;

    try {
        // THE DEFINITIVE FIX: Bypass the SDK's verify method and use Nuxt's $fetch directly.
        // This gives us full control over the request and response, avoiding the SDK's internal bug.
        const verification = await $fetch<{ status: boolean, message: string, data: any }>(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                'Authorization': `Bearer ${paystackSecret!}`
            }
        });

        if (!verification.status || verification.data?.status !== 'success') {
            console.warn(`Paystack verification failed for reference: ${reference}. Reason: ${verification.message}`);
            return { status: 'success' }; // Acknowledge the webhook but do not process
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
                                        select: { sellerId: true, title: true } 
                                    } 
                                } 
                            } 
                        } 
                    } 
                }
            });

            if (!order || order.status === EOrderStatus.PAID) {
                return;
            }
            
            if (order.totalAmount !== verifiedAmount) {
                console.warn(`Amount mismatch for order ${order.id}. Expected ${order.totalAmount}, got ${verifiedAmount}`);
                return;
            }

            // --- SELLER WALLET & COMMISSION LOGIC ---
            const earningsBySeller: Record<string, { totalSale: number, items: string[] }> = {};
            for (const item of order.orderItem) {
                const sellerId = item.variant.product.sellerId;
                const itemPrice = item.variant.price || 0;
                if (!earningsBySeller[sellerId]) {
                    earningsBySeller[sellerId] = { totalSale: 0, items: [] };
                }
                earningsBySeller[sellerId].totalSale += itemPrice * item.quantity;
                earningsBySeller[sellerId].items.push(item.variant.product.title);
            }

            for (const sellerId in earningsBySeller) {
                const { totalSale, items } = earningsBySeller[sellerId];
                const commission = totalSale * PLATFORM_COMMISSION_RATE;
                const sellerEarnings = totalSale - commission;

                const sellerWallet = await tx.sellerWallet.upsert({
                    where: { sellerId: sellerId },
                    update: {},
                    create: { sellerId: sellerId }
                });
                
                await tx.sellerWallet.update({
                    where: { id: sellerWallet.id },
                    data: { balance: { increment: sellerEarnings } }
                });
                
                await tx.transaction.create({
                    data: {
                        walletId: sellerWallet.id,
                        amount: sellerEarnings,
                        type: 'SALE',
                        orderId: order.id,
                        description: `Earnings from Order #${order.id}`
                    }
                });

                await tx.notification.create({
                    data: {
                        userId: sellerId,
                        type: 'ORDER',
                        message: `New order received for: ${items.join(', ').substring(0, 100)}...`,
                        orderId: order.id
                    }
                });

                await tx.orders.update({
                where: { id: order.id },
                data: { 
                    status: EOrderStatus.PAID,
                    payoutAmount: sellerEarnings
                },
            });
            }
        });
        
    } catch (error: any) {
      console.error(`Error processing webhook for reference ${reference}:`, error);
      const errorMessage = error.data?.message || error.message || 'Error updating order';
      throw createError({ statusCode: 500, message: errorMessage });
    }
  }

  return { status: 'success' };
});

