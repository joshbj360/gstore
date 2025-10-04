import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';
import { z } from 'zod';
import { NotificationType } from '@prisma/client'; // Import the enum

const shipOrderSchema = z.object({
    orderId: z.number(),
    trackingNumber: z.string().min(1, "Tracking number is required."),
    shipper: z.string().min(1, "Shipper name is required."),
});

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const validation = await readValidatedBody(event, body => shipOrderSchema.safeParse(body));
    if (!validation.success) {
        throw createError({ statusCode: 400, message: validation.error.issues.map(i => i.message).join(', ') });
    }

    const { orderId, trackingNumber, shipper } = validation.data;

    try {
        // Use a transaction to ensure both updates happen together
        const updatedOrder = await prisma.$transaction(async (tx) => {
            const order = await tx.orders.findFirst({
                where: {
                    id: orderId,
                    orderItem: { some: { variant: { product: { sellerId: user.id } } } }
                }
            });

            if (!order) {
                throw createError({ statusCode: 403, message: "You do not have permission to update this order." });
            }

            const updated = await tx.orders.update({
                where: { id: orderId },
                data: {
                    status: 'SHIPPED',
                    trackingNumber: trackingNumber,
                    shipper: shipper,
                }
            });

            // THE FIX: Create a notification for the buyer
            await tx.notification.create({
                data: {
                    userId: order.userId, // The ID of the buyer who placed the order
                    type: 'ORDER',
                    message: `Your order #${order.id} has been shipped by ${shipper}. Tracking: ${trackingNumber}`,
                    orderId: order.id,
                }
            });

            return updated;
        });

        return updatedOrder;
    } catch (error: any) {
        console.error("Failed to mark order as shipped:", error);
        throw createError({ statusCode: error.statusCode || 500, message: error.message || "Could not update order." });
    }
});

