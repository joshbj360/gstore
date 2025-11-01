import prisma from '~/server/prisma/prismaClient';
import { z } from 'zod';
import { MediaType, ProductStatus } from '@prisma/client';
import type { IReel } from '~/models'; // Import the new interface

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(20).default(10),
  page: z.coerce.number().min(1).default(1),
});

/**
 * @description Fetches a paginated, unified feed of all *video* content.
 */
export default defineEventHandler(async (event) => {
    const { limit, page } = querySchema.parse(getQuery(event));
    const offset = (page - 1) * limit;

    try {
        const now = new Date();

        // --- Step 1: Fetch a paginated batch from all 3 video sources ---
        const storiesPromise = prisma.story.findMany({
            where: { media: { type: 'VIDEO' }, expiresAt: { gt: now }, product: { status: 'PUBLISHED' } },
            orderBy: { created_at: 'desc' },
            take: limit, skip: offset,
            include: {
                media: true,
                author: { select: { id: true, username: true, avatar: true, role: true, sellerProfile: { select: { store_slug: true } } } },
                product: { select: { id: true, slug: true, title: true, price: true, _count: { select: { likes: true, comments: true } } } }
            }
        });

        const postsPromise = prisma.post.findMany({
            where: { media: { type: 'VIDEO' } },
            orderBy: { created_at: 'desc' },
            take: limit, skip: offset,
            include: {
                media: true,
                author: { select: { id: true, username: true, avatar: true, role: true, sellerProfile: { select: { store_slug: true } } } },
                _count: { select: { likes: true} },
                taggedProducts: { include: { product: { select: { id: true, slug: true, title: true, price: true } } } }
            }
        });

        const productsPromise = prisma.products.findMany({
            where: { status: 'PUBLISHED', media: { some: { type: 'VIDEO' } } },
            orderBy: { created_at: 'desc' },
            take: limit, skip: offset,
            include: {
                media: { where: { type: 'VIDEO' }, orderBy: { created_at: 'asc' }, take: 1 },
                seller: { include: { profile: { select: { id: true, username: true, avatar: true, role: true, sellerProfile: { select: { store_slug: true } } } } } },
                _count: { select: { likes: true, comments: true } }
            }
        });
        
        const [stories, buyerPosts, productsWithVideo] = await Promise.all([storiesPromise, postsPromise, productsPromise]);

        // --- Step 2: Standardize and Merge ---
        const allReels = [
            ...stories.map(s => ({
                id: `story-${s.id}`,
                type: 'STORY' as const,
                created_at: s.created_at,
                media: s.media,
                author: { ...s.author, store_slug: s.author.sellerProfile?.store_slug },
                product: s.product,
                caption: s.product?.title || `Check out this story!`,
                likeCount: s.product?._count?.likes || 0,
                commentCount: s.product?._count?.comments || 0,
            })),
            ...buyerPosts.map(p => ({
                id: `post-${p.id}`,
                type: 'POST' as const,
                created_at: p.created_at,
                media: p.media,
                author: { ...p.author, store_slug: p.author.sellerProfile?.store_slug },
                product: p.taggedProducts[0]?.product || null,
                caption: p.caption ?? '',
                likeCount: p._count.likes,
                commentCount: 0, // Assuming posts don't have comments count
            })),
            ...productsWithVideo.map(p => ({
                id: `product-${p.id}`,
                type: 'PRODUCT' as const,
                created_at: p.created_at,
                media: p.media[0],
                author: {
                    id: p.seller.profile.id,
                    username: p.seller.store_name,
                    avatar: p.seller.store_logo,
                    role: 'seller',
                    store_slug: p.seller.store_slug
                },
                product: p,
                caption: p.title,
                likeCount: p._count.likes,
                commentCount: p._count.comments,
            }))
        ];

        // --- Step 3: Sort and Paginate ---
        const sortedReels = allReels.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const paginatedReels = sortedReels.slice(0, limit);
        const hasMore = stories.length === limit || productsWithVideo.length === limit || buyerPosts.length === limit;

        return { reels: paginatedReels, meta: { hasMore, total: allReels.length } };

    } catch (error) {
        console.error("Error fetching reels feed:", error);
        throw createError({ statusCode: 500, message: 'Internal Server Error' });
    }
})

