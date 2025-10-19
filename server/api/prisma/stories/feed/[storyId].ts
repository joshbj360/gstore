import prisma from '~/server/prisma/prismaClient';
import { z } from 'zod';
import { IStory } from '~/models';

export default defineEventHandler(async (event) => {
    const storyId = event.context.params!.storyId;

    // Validate the incoming storyId
    const validation = z.uuid().safeParse(storyId);
    if (!validation.success) {
        throw createError({ statusCode: 400, message: 'Invalid Story ID.' });
    }

    try {
        const now = new Date();

        // 1. Fetch the main story that the user clicked on.
        const mainStory = await prisma.story.findFirst({
            where: {
                id: storyId,
                expiresAt: { gt: now } // Ensure the story hasn't expired
            },
            include: {
                media: {select: {id: true, url: true, type: true}},
                seller: { select: { store_name: true, store_slug: true, store_logo: true } },
                product: { select: { slug: true } }
            }
        });

        if (!mainStory) {
            throw createError({ statusCode: 404, message: 'This story could not be found or has expired.' });
        }

        // 2. Fetch other recent, active stories from the SAME seller.
        const otherStoriesFromSeller = await prisma.story.findMany({
            where: {
                sellerId: mainStory.sellerId,
                id: { not: storyId }, // Exclude the main story
                expiresAt: { gt: now }
            },
            include: {
                media: {select: {id: true, url: true, type: true}},
                seller: { select: { store_name: true, store_slug: true, store_logo: true } },
                product: { select: { slug: true } }
            },
            orderBy: { created_at: 'desc' },
            take: 5 // Limit to 5 other stories from this seller
        });

        // 3. Fetch recent, active stories from OTHER sellers to fill the feed.
        const otherStories = await prisma.story.findMany({
            where: {
                sellerId: { not: mainStory.sellerId }, // Exclude the current seller
                expiresAt: { gt: now }
            },
            include: {
                media: {select: {id: true, url: true, type: true}},
                seller: { select: { store_name: true, store_slug: true, store_logo: true } },
                product: { select: { slug: true } }
            },
            orderBy: { created_at: 'desc' },
            take: 10 // Limit to 10 stories from other sellers
        });

        // 4. Combine them into a single, ordered feed.
        const feed
         = [
            mainStory,
            ...otherStoriesFromSeller,
            ...otherStories
        ];
        
        // Remove any potential duplicates, although the queries should prevent this.
        const uniqueFeed = Array.from(new Map(feed.map(item => [item.id, item])).values());

        return uniqueFeed;

    } catch (error: any) {
        console.error("Error fetching story feed:", error);
        throw createError({ statusCode: error.statusCode || 500, message: error.message || 'Could not fetch story feed.' });
    }
});
