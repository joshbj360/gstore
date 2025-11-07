import prisma from '~/server/prisma/prismaClient';
import { z } from 'zod';
import { ProductStatus } from '@prisma/client';

export default defineEventHandler(async (event) => {
    const slug = event.context.params?.slug;
    if (!slug) {
        throw createError({ statusCode: 400, message: 'Product slug is required.' });
    }

    try {
        // This is the "correct" query from your description, but now
        // it uses `select` for robustness.
        const product = await prisma.products.findUnique({
            where: { slug: slug },
            select: {
                id: true,
                title: true,
                slug: true,
                description: true,
                price: true,
                discount: true,
                status: true,
                sellerId: true,
                shippingZoneId: true,
                soldCount: true,
                isAccessory: true,
                category: { 
                    select: { 
                        category: { select: { name: true, slug: true } }
                    }
                },
                tags: { 
                    select: { 
                        tag: { select: { name: true } }
                    } 
                },
                media: {
                    select: {
                        id: true,
                        url: true,
                        public_id: true,
                        type: true,
                        altText: true
                    }
                },
                measurement: true,
                variants: {
                    where: { stock: { gt: 0 } } // Only fetch variants that are in stock
                },
                seller: {
                    select: {
                        id: true,
                        store_name: true,
                        store_slug: true,
                        store_logo: true,
                        is_verified: true,
                        store_location: true,
                        shippingZones: {
                            include: {
                                rates: true
                            }
                        }
                    }
                }
            }
        });

        if (!product || product.status !== 'PUBLISHED') {
            throw createError({ statusCode: 404, message: 'Product not found.' });
        }

        return product;

    } catch (error: any) {
        console.error("Error fetching product by slug:", error);
        throw createError({ statusCode: error.statusCode || 500, message: error.message || 'Could not load product.' });
    }
});
