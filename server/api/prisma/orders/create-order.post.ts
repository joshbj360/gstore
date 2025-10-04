import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';
import { EOrderStatus, type ICartItem } from '~/models';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const { shippingAddress, checkoutItems, totalAmount, paymentReference, paymentMethod } = await readBody(event);

    try {
        // Use a transaction to ensure all database operations succeed or fail together
        const order = await prisma.$transaction(async (tx) => {
            // 1. Create the main Order record
            const newOrder = await tx.orders.create({
                data: {
                    userId: user.id,
                    stripeId: paymentReference, // Using stripeId field for payment reference
                    totalAmount: totalAmount,
                    status: EOrderStatus.PENDING, // All orders start as PENDING
                    // Shipping details
                    name: shippingAddress.name,
                    address: shippingAddress.address,
                    county: shippingAddress.county,
                    country: shippingAddress.country,
                    zipcode: shippingAddress.postalCode || '',
                    paymentMethod: paymentMethod
                }
            });

            // 2. Create the OrderItem records for each item in the checkout
            await tx.orderItem.createMany({
                data: checkoutItems.map((item: ICartItem) => ({
                    orderId: newOrder.id,
                    variantId: item.variant.id,
                    quantity: item.quantity,
                }))
            });

            // 3. Decrement the stock for each purchased variant
            for (const item of checkoutItems) {
                await tx.productVariant.update({
                    where: { id: item.variant.id },
                    data: {
                        stock: {
                            decrement: item.quantity
                        }
                    }
                });
            }
            
            // If it's a POD order, we might create a specific transaction record here
            // e.g., await tx.transaction.create(...)

            return newOrder;
        });
        
        // 4. Clear the user's cart in the database
        await prisma.cartItem.deleteMany({
            where: { 
                userId: user.id,
                variantId: {
                    in: checkoutItems.map((item: ICartItem) => item.variant.id)
                }
            }
        });
        
        return order;

    } catch (error) {
        console.error("Order creation failed:", error);
        throw createError({ statusCode: 500, message: "Could not create your order." });
    }
});
