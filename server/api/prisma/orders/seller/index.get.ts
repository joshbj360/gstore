import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' });
    
    
    // This is a complex query that fetches everything needed for the dashboard in one go.
    const orders = await prisma.orders.findMany({
        where: {
            // Find orders where at least one item belongs to the current seller
            orderItem: {
                some: {
                    variant: {
                        product: {
                            sellerId: user.id
                        }
                    }
                }
            }
        },
        include: {
            // Include the buyer's profile information
            user: {
                select: {
                    username: true,
                    email: true,
                }
            },
            // Include all items in the order, with their nested details
            orderItem: {
                include: {
                    variant: {
                        include: {
                            product: {
                                select: {
                                    title: true,
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