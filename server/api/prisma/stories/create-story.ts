import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';
import { z } from 'zod';
import { EMediaType } from '~/models';

// This schema now expects the full media object from the Cloudinary upload
const storySchema = z.object({
    media: z.object({
        url: z.url(),
        public_id: z.string(),
        type: z.enum(EMediaType),
        width: z.number().optional(),
        height: z.number().optional(),
    }),
    productId: z.number().optional().nullable(),
});

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const sellerProfile = await prisma.sellerProfile.findUnique({ where: { profileId: user.id } });
    if (!sellerProfile) throw createError({ statusCode: 403, message: 'Only sellers can post stories.' });
    console.log(event)
    const validation = await readValidatedBody(event, body => storySchema.safeParse(body));
    console.log("Validation result:", validation);
    if (!validation.success) {
        throw createError({ statusCode: 400, message: 'Invalid story data.' });
    }
    const { media, productId } = validation.data;

    // Stories expire 24 hours from creation
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    try {
        // THE FIX: Use a transaction to create both records atomically.
        const newStory = await prisma.$transaction(async (tx) => {
            // Step 1: Create the Media record in your database first.
            const newMediaRecord = await tx.media.create({
                data: {
                    url: media.url,
                    public_id: media.public_id,
                    type: media.type,
                    metadata: { width: media.width, height: media.height },
                    sellerId: sellerProfile.id,
                }
            });

            // Step 2: Use the ID of the newly created media record to create the Story.
            const createdStory = await tx.story.create({
                data: {
                    mediaId: newMediaRecord.id, // Use the ID from the record we just created
                    sellerId: sellerProfile.id,
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

