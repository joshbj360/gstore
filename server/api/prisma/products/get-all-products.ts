import prisma from '~/server/prisma/prismaClient';
import { z } from 'zod';
import { ProductStatus } from '@prisma/client';

// Define a schema to validate the pagination query
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

/**
 * @description Fetches a paginated list of all PUBLISHED products.
 * This is the main endpoint for the "Discover" page.
 */
export default defineCachedEventHandler(async (event) => {
    const queryParams = getQuery(event);
    const validation = querySchema.safeParse(queryParams);

    if (!validation.success) {
        throw createError({ statusCode: 400, message: 'Invalid pagination parameters.' });
    }

    const { page, limit } = validation.data;
    const skip = (page - 1) * limit;

    try {
        const whereClause = {
            status: ProductStatus.PUBLISHED,
            isAccessory: false,
            isFeatured: false,
        };

        // Use a transaction to get both products and the total count efficiently
        const [products, total] = await prisma.$transaction([
            // 1. Get the paginated products
            prisma.products.findMany({
                where: whereClause,
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    price: true,
                    discount: true,
                    soldCount: true,
                    sellerId: true,
                    variants: {
                        select: { id: true, size: true, stock: true }
                    },
                    media: {
                        take: 1,
                        select: { url: true, public_id: true, type: true }
                    },
                    seller: {
                        select: {
                            store_name: true,
                            store_slug: true,
                            store_logo: true,
                            is_verified: true,
                        }
                    },
                    _count: {
                        select: {
                            likes: true,
                            comments: true,
                        }
                    }
                },
                skip: skip,
                take: limit,
                orderBy: { created_at: 'desc' }


                
            }),
            // 2. Get the total count of all products that match the filter
            prisma.products.count({ where: whereClause })
        ]);

        return {
            products,
            meta: {
                currentPage: page,
                perPage: limit,
                total,
                hasMorePages: skip + products.length < total,
            }
        };

    } catch (error) {
        console.error("Error fetching all products:", error);
        throw createError({
            statusCode: 500,
            statusMessage: "Internal Server Error",
        });
    }
}, {
    maxAge: 60 // Cache results for 1 minute
});
