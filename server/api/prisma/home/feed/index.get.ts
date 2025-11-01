import prisma from '~/server/prisma/prismaClient';
import { ProductStatus } from '@prisma/client';
import { z } from 'zod';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(20).default(10),
});

export default defineEventHandler(async (event) => {
    const queryParams = getQuery(event);
    const validation = querySchema.safeParse(queryParams);
    if (!validation.success) {
        throw createError({ statusCode: 400, message: 'Invalid query parameters.' });
    }
    const { page, limit } = validation.data;
    const offset = (page - 1) * limit;

    try {
        // 1. Fetch "Buyer Posts" (UGC)
        const buyerPosts = await prisma.post.findMany({
            orderBy: { created_at: 'desc' },
            take: limit,
            skip: offset,
            include: {
                author: { select: { username: true, avatar: true, role: true } },
                media: true,
                _count: { select: { likes: true } },
                taggedProducts: { 
                    include: { 
                        product: { select: { slug: true, title: true } }
                    }
                }
            }
        });

        // 2. Fetch "Seller Posts" (Products)
        const sellerPosts = await prisma.products.findMany({
            where: { status: 'PUBLISHED' },
            orderBy: { created_at: 'desc' },
            take: limit,
            skip: offset,
            include: {
                seller: { 
                    include: { 
                        profile: { select: { username: true, avatar: true, role: true } } 
                    } 
                },
                media: { take: 1, orderBy: { created_at: 'asc' } },
                _count: { select: { likes: true, comments: true } },
                variants: { where: { stock: { gt: 0 } } },
                likes: { select: { userId: true } } // Used for optimistic count
            }
        });

        // 3. Standardize and Merge
        const standardizedBuyerPosts = buyerPosts.map(post => ({
            type: 'POST' as const,
            id: post.id,
            created_at: post.created_at,
            author: post.author,
            media: post.media,
            caption: post.caption,
            likeCount: post._count.likes,
            taggedProducts: post.taggedProducts.map(tp => tp.product)
        }));

        const standardizedSellerPosts = sellerPosts.map(product => ({
            type: 'PRODUCT' as const,
            id: `product-${product.id}`,
            created_at: product.created_at,
            author: {
                username: product.seller.store_name,
                avatar: product.seller.store_logo,
                role: product.seller.profile.role,
            },
            media: product.media[0],
            caption: product.title,
            likeCount: product._count.likes,
            taggedProducts: [product],
            product: product, // Pass the full product
        }));

        // 4. Sort the combined feed by date and paginate
        const combinedFeed = [...standardizedBuyerPosts, ...standardizedSellerPosts]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        const paginatedFeed = combinedFeed.slice(0, limit); // Simplified pagination for this merge
        const hasMore = combinedFeed.length > limit;

        return { feed: paginatedFeed, meta: { hasMore } };

    } catch (error: any) {
        console.error("Error fetching unified feed:", error);
        throw createError({ statusCode: 500, message: "Could not load feed." });
    }
});

