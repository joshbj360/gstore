import prisma from '~/server/prisma/prismaClient';
import { z } from 'zod';
import { MediaType, ProductStatus } from '@prisma/client';

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(20).default(10),
  page: z.coerce.number().min(1).default(1),
});

export default defineEventHandler(async (event) => {
    const queryParams = getQuery(event);
    const validation = querySchema.safeParse(queryParams);
    if (!validation.success) {
        throw createError({ statusCode: 400, message: 'Invalid query parameters.' });
    }

    const { limit, page } = validation.data;
    const offset = (page - 1) * limit;

    try {
        const now = new Date();

        // Step 1: Fetch active video stories, but only if their linked product is PUBLISHED.
        const stories = await prisma.story.findMany({
            where: { 
                media: { type: 'VIDEO' }, 
                expiresAt: { gt: now },
                // This is the status check: ensures the linked product is active.
                product: {
                    status: 'PUBLISHED'
                }
            },
            include: {
                media: true,
                seller: { select: { store_name: true, store_slug: true, store_logo: true, is_verified: true } },
                product: { 
                    select: { 
                        id: true, slug: true, title: true, price: true, 
                        variants: { where: { stock: { gt: 0 } } },
                        _count: { select: { likes: true, comments: true } }
                    }
                }
            }
        });

        const productIdsInStories = stories.map(story => story.productId).filter((id): id is number => id !== null);

        // Step 2: Fetch products with video that are PUBLISHED and NOT already in stories.
        const productsWithVideo = await prisma.products.findMany({
            where: {
                status: 'PUBLISHED', // This is the status check for product reels.
                id: { notIn: productIdsInStories },
                media: { some: { type: 'VIDEO' } }
            },
            include: {
                media: { where: { type: 'VIDEO' }, orderBy: { created_at: 'asc' }, take: 1 },
                seller: { select: { store_name: true, store_slug: true, store_logo: true, is_verified: true } },
                variants: { where: { stock: { gt: 0 } } },
                _count: { select: { likes: true, comments: true } }
            }
        });

        // Step 3: Standardize and Merge the two lists.
        const allReels = [
            ...stories.map(story => ({
                id: `story-${story.id}`,
                type: 'story',
                created_at: story.created_at,
                media: story.media,
                seller: story.seller,
                product: story.product,
            })),
            ...productsWithVideo.map(product => ({
                id: `product-${product.id}`,
                type: 'product',
                created_at: product.created_at,
                media: product.media[0],
                seller: product.seller,
                product: {
                    id: product.id, slug: product.slug, title: product.title, price: product.price,
                    variants: product.variants, _count: product._count,
                }
            }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        // Step 4: Apply pagination to the final, merged list.
        const paginatedReels = allReels.slice(offset, offset + limit);
        const hasMore = allReels.length > offset + limit;

        return { reels: paginatedReels, meta: { hasMore, total: allReels.length } };

    } catch (error) {
        console.error("Error fetching reels feed:", error);
        throw createError({ statusCode: 500, message: 'Could not load reels feed.' });
    }
});

