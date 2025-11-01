import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';
import { z } from 'zod';
import { MediaType, ProductStatus } from '@prisma/client';

// This Zod schema validates the *full* product payload from the form.
const productUpdateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long.'),
  description: z.string().optional(),
  price: z.number().positive('Price must be a positive number.'),
  discount: z.number().optional().nullable(),
  shippingZoneId: z.string().uuid('A valid shipping profile is required.'),
  category: z.object({ name: z.string() }),
  tags: z.array(z.object({ name: z.string() })),
  variants: z.array(z.object({
      size: z.string().min(1),
      stock: z.number().int().min(0),
      price: z.number().positive().nullable(),
  })).min(1, "At least one product variant is required."),
  media: z.array(z.object({
      url: z.string().url(),
      type: z.nativeEnum(MediaType),
      public_id: z.string(),
      width: z.number().optional().nullable(),
      height: z.number().optional().nullable(),
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
            message: validation.error.issues.map(i => i.message).join(', ')
        });
    }

    const body = validation.data;

    try {
        // THE FIX: Use an interactive transaction for a robust "delete and replace"
        const updatedProduct = await prisma.$transaction(async (tx) => {
            
            // Step 1: Verify ownership
            await tx.products.findFirstOrThrow({
                where: { id: productId, sellerId: sellerProfile.id }
            });

            // Step 2: Delete all old many-to-many and one-to-many relations
            // This "resets" the product before we add the new data.
            await Promise.all([
                tx.productVariant.deleteMany({ where: { productId: productId } }),
                tx.productCategories.deleteMany({ where: { productId: productId } }),
                tx.productTags.deleteMany({ where: { productId: productId } }),
                tx.productRelation.deleteMany({ where: { styledWithId: productId } })
                // We do NOT delete media, as that was handled in the 'create-draft' step.
            ]);

            // Step 3: Update the product with the new data
            const product = await tx.products.update({
                where: { id: productId },
                data: {
                    // Update simple fields
                    title: body.title,
                    description: body.description,
                    price: body.price,
                    discount: body.discount,
                    shippingZoneId: body.shippingZoneId,
                    isAccessory: body.isAccessory || false,
                    status: 'PUBLISHED', // Flip the product from DRAFT to PUBLISHED

                    // Re-create all the relations from scratch
                    category: {
                        create: [{
                            category: {
                                connectOrCreate: {
                                    where: { name: body.category.name },
                                    create: { name: body.category.name, slug: body.category.name.toLowerCase().replace(/\s+/g, '-') }
                                }
                            }
                        }]
                    },
                    tags: {
                        create: body.tags.map(tag => ({
                            tag: {
                                connectOrCreate: {
                                    where: { name: tag.name },
                                    create: { name: tag.name }
                                }
                            }
                        }))
                    },
                    variants: {
                        create: body.variants.map(variant => ({
                            size: variant.size,
                            stock: variant.stock,
                            price: variant.price
                        }))
                    },
                    styledWith: {
                        create: body.linkedProductIds?.map(id => ({
                            appearsIn: {
                                connect: { id: id }
                            }
                        }))
                    }
                },
                include: { media: true, variants: true, category: true, tags: true, styledWith: true }
            });

            return product;
        });

        return updatedProduct;

    } catch (error: any) {
        console.error(`Error updating product ${productId}:`, error);
        if (error.code === 'P2025' || error.message.includes("findFirstOrThrow")) {
             throw createError({ statusCode: 404, message: 'Product not found or you do not have permission.' });
        }
        throw createError({ statusCode: 500, message: error.message || 'Failed to update product.' });
    }
});

