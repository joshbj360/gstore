import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';
import { z } from 'zod';
import { NotificationType, MediaType } from '@prisma/client';

const postSchema = z.object({
  media: z.object({
    url: z.string().url(),
    public_id: z.string(),
    type: z.nativeEnum(MediaType),
    width: z.number().optional().nullable(),
    height: z.number().optional().nullable(),
  }),
  caption: z.string().optional(),
  taggedProductIds: z.array(z.number()).optional(),
});

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) throw createError({ statusCode: 401, message: 'You must be logged in to post.' });

    const validation = await readValidatedBody(event, body => postSchema.safeParse(body));
    if (!validation.success) {
        throw createError({ statusCode: 400, message: 'Invalid post data.' });
    }
    const { media, caption, taggedProductIds } = validation.data;

    try {
        const newPost = await prisma.$transaction(async (tx) => {
            const sellerProfile = await tx.sellerProfile.findUnique({ 
                where: { profileId: user.id },
                select: { id: true }
            });

            const newMediaRecord = await tx.media.create({
                data: {
                    url: media.url,
                    public_id: media.public_id,
                    type: media.type,
                    metadata: { width: media.width, height: media.height },
                    authorId: user.id, // THE FIX: Use authorId
                    sellerId: sellerProfile?.id,
                }
            });

            const createdPost = await tx.post.create({
                data: {
                    authorId: user.id,
                    mediaId: newMediaRecord.id,
                    caption: caption,
                }
            });

            if (taggedProductIds && taggedProductIds.length > 0) {
                await tx.productPostTag.createMany({
                    data: taggedProductIds.map(id => ({
                        postId: createdPost.id,
                        productId: id
                    }))
                });
            }
            return createdPost;
        });
        return newPost;
    } catch (error: any) {
        console.error("Error creating post:", error);
        throw createError({ statusCode: 500, message: "Could not create post." });
    }
});

