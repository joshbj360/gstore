import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';
import { z } from 'zod';
import { NotificationType } from '@prisma/client';

// THE FIX: The schema is now polymorphic
const commentSchema = z.object({
    text: z.string().min(1, "Comment text cannot be empty.").max(500),
    parentId: z.string().uuid().optional().nullable(),
    // One of these is required, but not both
    productId: z.number().optional().nullable(),
    postId: z.string().uuid().optional().nullable(),
}).refine(data => data.productId || data.postId, { // Must have at least one
    message: "A productId or postId is required.",
}).refine(data => !(data.productId && data.postId), { // Must not have both
    message: "Cannot comment on a product and a post simultaneously.",
});

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) throw createError({ statusCode: 401, message: 'You must be logged in to comment.' });

    const validation = await readValidatedBody(event, body => commentSchema.safeParse(body));
    if (!validation.success) {
        throw createError({ statusCode: 400, message: validation.error.issues.map(i => i.message).join(', ') });
    }
    const { productId, postId, text, parentId } = validation.data;

    try {
        const [newComment] = await prisma.$transaction(async (tx) => {
            
            // Create the comment first
            const createdComment = await tx.comment.create({
                data: {
                    authorId: user.id,
                    text: text,
                    parentId: parentId,
                    productId: productId,
                    postId: postId,
                },
                include: {
                    author: { select: { username: true, avatar: true } }
                }
            });

            // --- Notification Logic ---
            let notificationMessage = '';
            let recipientId: string | null = null;
            let linkId: { productId?: number, postId?: string } = {};

            if (productId) {
                // Find the product and its seller
                const product = await tx.products.findUnique({ 
                    where: { id: productId },
                    select: { sellerId: true, title: true }
                });
                if (!product) throw new Error("Product not found.");
                
                if (product.sellerId !== user.id) { // Don't notify on your own product
                    recipientId = product.sellerId;
                    notificationMessage = `${user.user_metadata.username || 'Someone'} ${parentId ? 'replied on' : 'commented on'} your product: ${product.title}`;
                    linkId = { productId };
                }

            } else if (postId) {
                // Find the post and its author
                const post = await tx.post.findUnique({
                    where: { id: postId },
                    select: { authorId: true, caption: true }
                });
                if (!post) throw new Error("Post not found.");
                
                if (post.authorId !== user.id) { // Don't notify on your own post
                    recipientId = post.authorId;
                    notificationMessage = `${user.user_metadata.username || 'Someone'} ${parentId ? 'replied on' : 'commented on'} your post.`;
                    linkId = { postId };
                }
            }

            // If we have a recipient, create the notification
            if (recipientId) {
                await tx.notification.create({
                    data: {
                        userId: recipientId,
                        actorId: user.id,
                        type: parentId ? NotificationType.REPLY : NotificationType.NEW_COMMENT,
                        message: notificationMessage,
                        commentId: createdComment.id,
                        ...linkId // Spread { productId: 123 } or { postId: "abc" }
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