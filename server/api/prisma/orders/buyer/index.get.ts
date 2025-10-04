import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';

/**
 * @description Securely fetches the complete order history for the currently authenticated user.
 */
export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({ statusCode: 401, message: 'Unauthorized' });
    }

    // This query fetches all orders linked to the user's ID and includes
    // all the necessary nested details for display.
    const orders = await prisma.orders.findMany({
        where: { userId: user.id },
        include: {
            orderItem: {
                include: {
                    variant: {
                        include: {
                            product: {
                                include: {
                                    media: true // Include media for displaying product images
                                }
                            }
                        }
                    }
                }
            }
        },
        orderBy: {
            created_at: 'desc'
        }
    });

    return orders;
});