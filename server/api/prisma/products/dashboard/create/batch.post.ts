import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';
import { z } from 'zod';

// Define a schema for a single product within the batch
const productSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    price: z.number().positive(),
    discount: z.number().optional().nullable(),
    category: z.string(),
    tags: z.array(z.string()),
    media: z.array(z.object({ url: z.string(), type: z.string() })),
    variants: z.array(z.object({ size: z.string(), stock: z.number() })),
});

const batchSchema = z.object({
    products: z.array(productSchema)
});

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const sellerProfile = await prisma.sellerProfile.findUnique({ where: { profileId: user.id } });
    if (!sellerProfile) throw createError({ statusCode: 403, message: 'Seller profile not found.' });

    const validation = await readValidatedBody(event, body => batchSchema.safeParse(body));
    if (!validation.success) {
        throw createError({ statusCode: 400, message: 'Invalid product data format.' });
    }
    
    const { products } = validation.data;
    
    // THE FIX: Use Promise.allSettled to process the batch in parallel.
    // This is much faster than a sequential for...of loop.
    const results = await Promise.allSettled(
        products.map(productData => 
            prisma.products.create({
                data: {
                    title: productData.title,
                    description: productData.description,
                    price: productData.price,
                    discount: productData.discount,
                    sellerId: sellerProfile.id,
                    slug: '', // Dummy value for the Prisma extension to handle
                    category: { create: [{ category: { connectOrCreate: { where: { name: productData.category }, create: { name: productData.category, slug: productData.category.toLowerCase().replace(/\s+/g, '-') } } } }] },
                    tags: { create: productData.tags.map(tag => ({ tag: { connectOrCreate: { where: { name: tag }, create: { name: tag } } } })) },
                    variants: { create: productData.variants },
                    media: { create: productData.media.map(m => ({ ...m, sellerId: sellerProfile.id, type: m.type as any })) }
                }
            })
        )
    );

    const createdCount = results.filter(r => r.status === 'fulfilled').length;
    const errors = results
        .map((result, index) => result.status === 'rejected' ? `Product "${products[index].title}": ${result.reason}` : null)
        .filter(Boolean);

    return {
        success: errors.length === 0,
        createdCount,
        errors
    };
});

