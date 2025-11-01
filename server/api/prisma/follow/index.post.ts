import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';
import { z } from 'zod';
import { NotificationType } from '@prisma/client'; // Import the enum

const followSchema = z.object({ sellerProfileId: z.string().uuid() });

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const { sellerProfileId } = await readValidatedBody(event, body => followSchema.parse(body));
    const followId = { followerId: user.id, followingId: sellerProfileId };

    try {
        const existingFollow = await prisma.follow.findUnique({ where: { followerId_followingId: followId } });

        if (existingFollow) {
            // --- UNFOLLOW ---
            await prisma.$transaction(async (tx) => {
                await tx.follow.delete({ where: { followerId_followingId: followId } });
                await tx.sellerProfile.update({
                    where: { id: sellerProfileId },
                    data: { followers_count: { decrement: 1 } }
                });
                // We don't typically send a notification for an unfollow
            });
            return { following: false };
        } else {
            // --- FOLLOW ---
            await prisma.$transaction(async (tx) => {
                await tx.follow.create({ data: followId });
                
                await tx.sellerProfile.update({
                    where: { id: sellerProfileId },
                    data: { followers_count: { increment: 1 } }
                });

                // THE FIX: Create a notification for the seller
                await tx.notification.create({
                    data: {
                        userId: (await tx.sellerProfile.findUnique({where: {id: sellerProfileId}}))!.profileId, // The seller being followed
                        actorId: user.id, // The user who did the following
                        type: 'NEW_FOLLOWER',
                        message: `${user.user_metadata.username || 'Someone'} started following you.`
                    }
                });
            });
            return { following: true };
        }
    } catch (error) {
        console.error("Error toggling follow:", error);
        throw createError({ statusCode: 500, message: 'Could not update follow status.' });
    }
});

