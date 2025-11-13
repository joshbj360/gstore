import prisma from '~/server/prisma/prismaClient';
import { z } from 'zod';
import { ProductStatus } from '@prisma/client';

// Schema to validate pagination query
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(12), // Default to 12 for a 3-col grid
});

/**
 * @description Fetches a paginated list of all verified sellers,
 * sorted by follower count.
 */
export default defineEventHandler(async (event) => {
    const queryParams = getQuery(event);
    const validation = querySchema.safeParse(queryParams);
    if (!validation.success) {
        throw createError({ statusCode: 400, message: 'Invalid pagination parameters.' });
    }

    const { page, limit } = validation.data;
    const skip = (page - 1) * limit;

    try {
        const whereClause = {
            is_verified: true, // We only want to promote verified sellers
        };

        const [sellers, total] = await prisma.$transaction([
            prisma.sellerProfile.findMany({
                where: whereClause,
                select: {
                    id: true,
                    store_name: true,
                    store_slug: true,
                    store_logo: true,
                    store_banner: true,
                    followers_count: true,
                    _count: { 
                        select: { products: { where: { status: 'PUBLISHED' } } }
                    }
                },
                orderBy: { followers_count: 'desc' },
                skip: skip,
                take: limit,
            }),
            prisma.sellerProfile.count({ where: whereClause })
        ]);

        return {
            sellers,
            meta: {
                currentPage: page,
                perPage: limit,
                total,
                hasMorePages: skip + sellers.length < total,
            }
        };

    } catch (error) {
        console.error("Error fetching all sellers:", error);
        throw createError({ statusCode: 500, message: "Could not load sellers." });
    }
});