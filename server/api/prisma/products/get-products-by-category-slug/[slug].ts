import prisma from '~/server/prisma/prismaClient';
import { z } from 'zod';
import { ProductStatus } from '@prisma/client';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export default defineEventHandler(async (event) => {
    const slug = event.context.params?.slug;
    if (!slug) {
        throw createError({ statusCode: 400, message: 'Category slug is required.' });
    }

    const queryParams = getQuery(event);
    const validation = querySchema.safeParse(queryParams);
    if (!validation.success) {
        throw createError({ statusCode: 400, message: 'Invalid pagination parameters.' });
    }

    const { page, limit } = validation.data;
    const skip = (page - 1) * limit;

    try {
        // This is the base query
        const whereClause: any = {
            status: ProductStatus.PUBLISHED,
            isAccessory: false,
        };

        // THE "SMART" LOGIC IS HERE:
        // If the slug is anything *other* than "all", we add the category filter.
        if (slug !== 'all') {
            whereClause.category = {
                some: {
                    category: {
                        slug: slug,
                    },
                },
            };
        }

        // The rest of the query runs with the finalized whereClause
        const [products, total] = await prisma.$transaction([
            prisma.products.findMany({
                where: whereClause,
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    price: true,
                    discount: true,
                    media: { take: 1, select: { url: true, public_id: true, type: true } },
                    seller: { select: { store_name: true, store_slug: true, is_verified: true, store_logo: true } },
                    variants: { select: { id: true, size: true, stock: true } },
                    likes: { select: { userId: true } },
                    _count: { select: { likes: true } }
                },
                orderBy: { created_at: 'desc' },
                skip: skip,
                take: limit,
            }),
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
        console.error("Error fetching category products:", error);
        throw createError({ statusCode: 500, message: "Could not load products." });
    }
});

