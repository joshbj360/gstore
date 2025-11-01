import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';

/**
 * @description Fetches a curated list of stories for the homepage.
 * - If the user is logged in, it fetches stories from sellers they follow.
 * - If the user is a guest (or follows no one), it falls back to a
 * generic feed of recent, popular stories.
 */
export default defineEventHandler(async (event) => {
    let user = null;
    try {
        user = await serverSupabaseUser(event);
    } catch (e) {
        console.warn("Could not retrieve user for stories, serving guest feed.");
    }

    let followedSellerIds: string[] = [];

    if (user) {
        const followedSellers = await prisma.follow.findMany({
            where: { followerId: user.id },
            select: { followingId: true }
        });
        followedSellerIds = followedSellers.map(f => f.followingId);
    }

    try {
        let stories;
        // If the user is logged in AND follows at least one seller, show their feed
        if (user && followedSellerIds.length > 0) {
            
            // THE FIX: We now filter by checking the author's related seller profile.
            // This finds all stories where the author is a profile that
            // is linked to a seller profile the user follows.
            stories = await prisma.story.findMany({
                where: {
                    expiresAt: { gt: new Date() },
                    author: {
                        sellerProfile: {
                            id: { in: followedSellerIds }
                        }
                    }
                },
                include: { 
                    media: true, 
                    author: { select: { username: true, avatar: true } }
                },
                orderBy: { created_at: 'desc' },
                take: 10,
            });
        } else {
            // Fallback for guests or new users: Show general recent stories
            stories = await prisma.story.findMany({
                where: { 
                    expiresAt: { gt: new Date() }
                },
                include: { 
                    media: true, 
                    author: { select: { username: true, avatar: true } }
                },
                orderBy: { created_at: 'desc' }, // You could also order by likes
                take: 10,
            });
        }
        return stories;

    } catch (error) {
        console.error("Error fetching stories feed:", error);
        return [];
    }
});

