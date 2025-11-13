import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';
import { z } from 'zod';
// THE FIX: Import the NotificationType enum
import { NotificationType } from '@prisma/client';

const likeSchema = z.object({ productId: z.number() });

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) throw createError({ statusCode: 401, message: 'You must be logged in to like a product.' });

    const validation = await readValidatedBody(event, body => likeSchema.safeParse(body));
    if (!validation.success) {
        throw createError({ statusCode: 400, message: 'Invalid product ID.' });
    }
    const { productId } = validation.data;

    const likeId = { userId: user.id, productId: productId };

    try {
        const existingLike = await prisma.like.findUnique({ where: { userId_productId: likeId } });

        if (existingLike) {
            // --- UNLIKE ---
            await prisma.like.delete({ where: { userId_productId: likeId } });
            // We typically don't notify on an unlike
            return { liked: false };
        } else {
            // --- LIKE ---
            // THE FIX: Use a transaction to create the like AND the notification
            await prisma.$transaction(async (tx) => {
                // 1. Create the like
                await tx.like.create({ data: likeId });

                // 2. Find the product's author (the seller)
                const product = await tx.products.findUnique({
                    where: { id: productId },
                    select: { id: true, sellerId: true, title: true }
                });

                // 3. Create the notification (if not liking your own product)
                if (product && product.sellerId !== user.id) {
                    await tx.notification.create({
                        data: {
                            userId: product.sellerId, // The seller is the recipient
                            actorId: user.id,        // The user who liked is the actor
                            type: NotificationType.POST_LIKE, // You can re-use POST_LIKE or create PRODUCT_LIKE
                            message: `${user.user_metadata.username || 'Someone'} liked your product: ${product.title.substring(0, 30)}...`,
                            productId: product.id
                        }
                    });
                }
            });
            return { liked: true };
        }
    } catch (error) {
        console.error("Error toggling product like:", error);
        throw createError({ statusCode: 500, message: 'Could not update like status.' });
    }
});