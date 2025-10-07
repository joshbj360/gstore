import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';
import { z } from 'zod';
import { NotificationType } from '@prisma/client';

const commentSchema = z.object({
    productId: z.number(),
    text: z.string().min(1, "Comment text cannot be empty.").max(500),
    parentId: z.string().uuid().optional().nullable(),
});

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) throw createError({ statusCode: 401, message: 'You must be logged in to comment.' });

    const validation = await readValidatedBody(event, body => commentSchema.safeParse(body));
    if (!validation.success) {
        throw createError({ statusCode: 400, message: validation.error.issues.map(i => i.message).join(', ') });
    }
    const { productId, text, parentId } = validation.data;

    try {
        const [newComment] = await prisma.$transaction(async (tx) => {
            const product = await tx.products.findUnique({ where: { id: productId } });
            if (!product) throw createError({ statusCode: 404, message: "Product not found." });

            const createdComment = await tx.comment.create({
                data: {
                    productId: productId,
                    authorId: user.id,
                    text: text,
                    parentId: parentId,
                },
                include: {
                    author: { select: { username: true, avatar: true } }
                }
            });

            // Create a notification for the product's seller
            if (product.sellerId !== user.id) { // Don't notify if commenting on your own product
                await tx.notification.create({
                    data: {
                        userId: product.sellerId, // The recipient is the seller
                        actorId: user.id,        // The actor is the one who commented
                        type: parentId ? NotificationType.REPLY : NotificationType.NEW_COMMENT,
                        message: `${user.user_metadata.user_name || 'Someone'} ${parentId ? 'replied to a comment on' : 'commented on'} your product: ${product.title}`,
                        productId: product.id,
                        commentId: createdComment.id,
                    }
                });
            }

            return [createdComment];
        });

        return newComment;

    } catch (error: any) {
        console.error("Failed to create comment:", error);
        throw createError({ statusCode: error.statusCode || 500, message: error.message || "Could not post comment." });
    }
});
