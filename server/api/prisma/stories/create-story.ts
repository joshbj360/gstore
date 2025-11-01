import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';
import { z } from 'zod';
import { MediaType } from '@prisma/client';

const storySchema = z.object({
    media: z.object({
        url: z.string().url(),
        public_id: z.string(),
        type: z.nativeEnum(MediaType),
        width: z.number().optional().nullable(),
        height: z.number().optional().nullable(),
    }),
    productId: z.number().optional().nullable(),
});

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) throw createError({ statusCode: 401, message: 'You must be logged in to post a story.' });

    const validation = await readValidatedBody(event, body => storySchema.safeParse(body));
    if (!validation.success) {
        throw createError({ statusCode: 400, message: 'Invalid story data.' });
    }
    const { media, productId } = validation.data;

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    try {
        const newStory = await prisma.$transaction(async (tx) => {
            // Find the seller ID (if it exists) to associate with the media
            const sellerProfile = await tx.sellerProfile.findUnique({ 
                where: { profileId: user.id },
                select: { id: true }
            });

            // Step 1: Create the Media record, now owned by the user.
            const newMediaRecord = await tx.media.create({
                data: {
                    url: media.url,
                    public_id: media.public_id,
                    type: media.type,
                    metadata: { width: media.width, height: media.height },
                    authorId: user.id, // THE FIX: Use authorId
                    sellerId: sellerProfile?.id, // Link to seller *if* they are one
                }
            });

            // Step 2: Create the Story, also owned by the user.
            const createdStory = await tx.story.create({
                data: {
                    mediaId: newMediaRecord.id,
                    authorId: user.id,
                    productId: productId,
                    expiresAt: expiresAt,
                }
            });

            return createdStory;
        });
        
        return newStory;

    } catch (error: any) {
        console.error("Error creating story:", error);
        throw createError({ statusCode: 500, message: "Could not create story." });
    }
});

