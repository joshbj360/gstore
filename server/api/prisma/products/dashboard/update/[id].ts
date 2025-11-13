import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';
import { z } from 'zod';
import { MediaType, ProductStatus } from '@prisma/client';

// Zod schema is correct from our last fix
const productUpdateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long.'),
  description: z.string().optional(),
  price: z.number().positive('Price must be a positive number.'),
  discount: z.number().optional().nullable(),
  shippingZoneId: z.string().uuid('A valid shipping profile is required.'),
  category: z.array(z.object({
    category: z.object({
      name: z.string()
    })
  })).min(1, "At least one category is required."),
  tags: z.array(z.object({ name: z.string() })),
  variants: z.array(z.object({
      size: z.string().min(1),
      stock: z.number().int().min(0),
      price: z.number().positive().nullable().optional(),
  })).min(1, "At least one product variant is required."),
  media: z.array(z.object({
      url: z.string().url(),
      type: z.string().transform(val => val.toUpperCase()).pipe(z.nativeEnum(MediaType)).optional().nullable(),
      public_id: z.string().optional().nullable(),
      width: z.number().optional().nullable(),
      height: z.number().optional().nullable(),
      metadata: z.any().optional(), 
      id: z.any().optional(),
      altText: z.any().optional()
  })).min(1, "At least one media file is required."),
  linkedProductIds: z.array(z.number()).optional(),
  isAccessory: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const sellerProfile = await prisma.sellerProfile.findUnique({ where: { profileId: user.id } });
    if (!sellerProfile) throw createError({ statusCode: 403, message: 'Seller profile not found.' });

    const productId = parseInt(event.context.params!.id, 10);
    if (isNaN(productId)) {
        throw createError({ statusCode: 400, message: 'Invalid Product ID.' });
    }

    const validation = await readValidatedBody(event, body => productUpdateSchema.safeParse(body));
    if (!validation.success) {
        console.error(`Failed to validate product update for product ID ${productId}:`, validation.error.issues);
        throw createError({ 
            statusCode: 400, 
            statusMessage: 'Invalid product data',
            message: validation.error.issues.map(i => `${i.path.join('.') || 'root'}: ${i.message}`).join(', ')
        });
    }

    const body = validation.data;

    try {
        const updatedProduct = await prisma.$transaction(async (tx) => {
            
            await tx.products.findFirstOrThrow({
                where: { id: productId, sellerId: sellerProfile.id }
            });

            await Promise.all([
                tx.media.deleteMany({ where: { productId: productId } }),
                tx.productVariant.deleteMany({ where: { productId: productId } }),
                tx.productCategories.deleteMany({ where: { productId: productId } }),
                tx.productTags.deleteMany({ where: { productId: productId } }),
                tx.productRelation.deleteMany({ where: { styledWithId: productId } })
            ]);

            await tx.products.update({
                where: { id: productId },
                data: {
                    title: body.title,
                    description: body.description,
                    price: body.price,
                    discount: body.discount,
                    shippingZoneId: body.shippingZoneId,
                    isAccessory: body.isAccessory || false,
                    status: 'PUBLISHED',
                }
            });

            // --- THE FIX IS HERE ---
            const categoryOps = body.category.map(cat => 
                tx.category.upsert({
                    where: { name: cat.category.name },
                    create: { name: cat.category.name, slug: cat.category.name.toLowerCase().replace(/\s+/g, '-') },
                    update: {}, // This empty object is the fix
                    select: { id: true }
                })
            );
            const tagOps = body.tags.map(tag => 
                tx.tag.upsert({
                    where: { name: tag.name },
                    create: { name: tag.name },
                    update: {}, // This empty object is the fix
                    select: { id: true }
                })
            );
            // -------------------------

            const categories = await Promise.all(categoryOps);
            const tags = await Promise.all(tagOps);

            await tx.productCategories.createMany({
                data: categories.map(cat => ({
                    productId: productId,
                    categoryId: cat.id
                }))
            });
            // Handle empty tags array
            if (tags.length > 0) {
                await tx.productTags.createMany({
                    data: tags.map(tag => ({
                        productId: productId,
                        tagId: tag.id
                    }))
                });
            }

            await tx.media.createMany({
                data: body.media.map(m => ({
                    url: m.url,
                    public_id: m.public_id,
                    type: m.type || 'IMAGE', 
                    metadata: m.metadata || {},
                    authorId: user.id,
                    sellerId: sellerProfile.id,
                    productId: productId 
                }))
            });
            await tx.productVariant.createMany({
                data: body.variants.map(variant => ({
                    size: variant.size,
                    stock: variant.stock,
                    price: variant.price,
                    productId: productId 
                }))
            });
            if (body.linkedProductIds && body.linkedProductIds.length > 0) {
                await tx.productRelation.createMany({
                    data: body.linkedProductIds.map(id => ({
                        styledWithId: productId,
                        appearsInId: id
                    }))
                });
            }

            return tx.products.findUnique({
                where: { id: productId },
                include: { media: true, variants: true, category: true, tags: true, styledWith: true }
            });
        });

        return updatedProduct;

    } catch (error: any) {
        console.error(`Error updating product ${productId}:`, error);
        if (error.code === 'P2002') { 
            throw createError({ statusCode: 409, message: "A database constraint failed. This might be a duplicate slug or other unique field." });
        }
        if (error.code === 'P2025' || error.message.includes("findFirstOrThrow")) {
             throw createError({ statusCode: 404, message: 'Product not found or you do not have permission.' });
        }
        throw createError({ statusCode: 500, message: error.message || 'Failed to update product.' });
    }
});