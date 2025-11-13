// server/api/prisma/home/feed/index.get.ts
import prisma from '~/server/prisma/prismaClient';
import { ProductStatus } from '@prisma/client';
import { z } from 'zod';
import type { IFeedItem } from '~/models'; // Import IFeedItem

// FIX: Updated schema for cursor pagination
const querySchema = z.object({
  limit: z.coerce.number().min(1).max(20).default(10),
  cursor: z.string().datetime().optional(), // The 'created_at' timestamp (ISO string) of the last item
});

export default defineEventHandler(async (event) => {
    const queryParams = getQuery(event);
    const validation = querySchema.safeParse(queryParams);
    if (!validation.success) {
        throw createError({ statusCode: 400, message: 'Invalid query parameters.' });
    }
    
    const { limit, cursor } = validation.data;
    
    // NEW: Define the cursor condition for Prisma
    const cursorCondition = cursor ? { created_at: { lt: new Date(cursor) } } : {};

    try {
        // 1. Fetch "Buyer Posts" (UGC)
        // --- FIX: Use cursorCondition, but still fetch 'limit' items
        const buyerPosts = await prisma.post.findMany({
            where: {
                ...cursorCondition
            },
            orderBy: { created_at: 'desc' },
            take: limit, // Fetch a full page worth
            include: {
                author: { select: { id: true, username: true, avatar: true, role: true } },
                media: true,
                _count: { select: { likes: true } },
                taggedProducts: { 
                    include: { 
                        product: { select: { slug: true, title: true, price: true } }
                    }
                }
            }
        });

        // 2. Fetch "Seller Posts" (Products)
        // --- FIX: Use cursorCondition, but still fetch 'limit' items
        const sellerPosts = await prisma.products.findMany({
            where: { 
                status: 'PUBLISHED',
                ...cursorCondition
            },
            orderBy: { created_at: 'desc' },
            take: limit, // Fetch a full page worth
            include: {
                seller: { 
                    include: { 
                       profile: { select: { id: true, username: true, avatar: true, role: true } } 
                    } 
                },
                media: { take: 1, orderBy: { created_at: 'asc' } },
                _count: { select: { likes: true, comments: true } },
                variants: { where: { stock: { gt: 0 } } },
                likes: { select: { userId: true } }
            }
        });

        // 3. Standardize and Merge (This part is the same)
        const standardizedBuyerPosts = buyerPosts.map(post => ({
            type: 'POST' as const,
            id: post.id,
            created_at: post.created_at,
            author: post.author,
            media: post.media,
            caption: post.caption,
            likeCount: post._count.likes,
            taggedProducts: post.taggedProducts.map(tp => tp.product),
            product: post.taggedProducts.map(tp => tp.product)
        }));

        const standardizedSellerPosts = sellerPosts.map(product => ({
            type: 'PRODUCT' as const,
            id: `product-${product.id}`,
            created_at: product.created_at,
            author: {
                id: product.seller.profile.id,
                username: product.seller.store_name,
                avatar: product.seller.store_logo,
                role: product.seller.profile.role,
            },
            media: product.media[0],
            caption: product.title,
            likeCount: product._count.likes,
            taggedProducts: [product],
            product: product,
        }));

        // 4. Sort the *combined batch* by date
        const combinedFeed = [...standardizedBuyerPosts, ...standardizedSellerPosts]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        // --- FIX: Apply pagination *after* sorting the batch ---
        // We take the top 'limit' items from our combined batch of (up to) 2*limit
        const paginatedFeed = combinedFeed.slice(0, limit);
        
        // --- FIX: Determine the new cursor and hasMore ---
        const newCursor = paginatedFeed.length > 0 ? paginatedFeed[paginatedFeed.length - 1].created_at.toISOString() : null;
        
        // We *might* have more if we got a full page.
        const hasMore = paginatedFeed.length === limit && newCursor !== null;

        return { 
            feed: paginatedFeed, 
            meta: { 
                hasMore,
                nextCursor: newCursor 
            } 
        };

    } catch (error: any) {
        console.error("Error fetching unified feed:", error);
        throw createError({ statusCode: 500, message: "Could not load feed." });
    }
});