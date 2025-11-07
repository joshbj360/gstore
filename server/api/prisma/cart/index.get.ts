import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';

/**
 * @description Securely fetches all cart items for the currently authenticated user.
 * It includes all necessary product, variant, and media data for display.
 */
export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({ statusCode: 401, message: 'Unauthorized' });
    }

    try {
        const cartItems = await prisma.cartItem.findMany({
            where: {
                userId: user.id,
            },
            include: {
                // We need to include the variant to get size and price
                variant: {
                    include: {
                        // We need to include the product to get the title, slug, and media
                        product: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                                price: true,
                                media: {
                                    take: 1, // Only need the main image
                                    select: {
                                        url: true,
                                        type: true,
                                        public_id: true
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

        // The store expects the `product` to be at the top level of the item,
        // so we can re-map it here for a cleaner frontend experience.
        const formattedCartItems = cartItems.map(item => ({
            id: item.id,
            userId: item.userId,
            quantity: item.quantity,
            created_at: item.created_at,
            variantId: item.variantId,
            variant: item.variant,
            product: item.variant.product, // Hoist the product object up
        }));

        return formattedCartItems;

    } catch (error) {
        console.error("Error fetching cart items:", error);
        throw createError({ statusCode: 500, message: "Could not load your cart." });
    }
});