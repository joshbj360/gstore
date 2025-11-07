import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';
import { z } from 'zod';

// Zod schema to validate the incoming body
// This ensures the action is one of the three allowed,
// and that variantId is always a positive number.
const cartActionSchema = z.object({
  action: z.enum(['add', 'update', 'remove']),
  variantId: z.number().positive(),
  quantity: z.number().min(1).optional(), // Optional for 'remove'
});

/**
 * @description A "smart" API endpoint to manage all cart modifications.
 * It reads an 'action' from the body to add, update, or remove items.
 */
export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({ statusCode: 401, message: 'Unauthorized' });
    }

    const validation = await readValidatedBody(event, body => cartActionSchema.safeParse(body));
    if (!validation.success) {
        throw createError({ 
            statusCode: 400, 
            statusMessage: 'Invalid cart data',
            message: validation.error.issues.map(i => i.message).join(', ') 
        });
    }

    const { action, variantId, quantity } = validation.data;
    const userId_variantId = {
        userId: user.id,
        variantId: variantId,
    };

    try {
        let cartItem;

        switch (action) {
            /**
             * ADD: Adds a new item. If it already exists, increments the quantity.
             * This is an "upsert" (update or insert) operation.
             */
            case 'add':
                if (!quantity) throw createError({ statusCode: 400, message: 'Quantity is required to add an item.' });
                
                cartItem = await prisma.cartItem.upsert({
                    where: { userId_variantId },
                    create: {
                        userId: user.id,
                        variantId: variantId,
                        quantity: quantity
                    },
                    update: {
                        quantity: {
                            increment: quantity
                        }
                    }
                });
                break;

            /**
             * UPDATE: Sets the quantity of an item to a specific amount.
             * If quantity is 0 or less, it removes the item.
             */
            case 'update':
                if (quantity === undefined) throw createError({ statusCode: 400, message: 'Quantity is required to update an item.' });

                if (quantity <= 0) {
                    // Treat as a 'remove' action
                    cartItem = await prisma.cartItem.delete({
                        where: { userId_variantId }
                    });
                } else {
                    cartItem = await prisma.cartItem.update({
                        where: { userId_variantId },
                        data: { quantity: quantity }
                    });
                }
                break;

            /**
             * REMOVE: Deletes an item from the cart.
             */
            case 'remove':
                cartItem = await prisma.cartItem.delete({
                    where: { userId_variantId }
                });
                break;
            
            default:
                throw createError({ statusCode: 400, message: 'Invalid cart action.' });
        }

        // Return the modified cart item (or the deleted one)
        return cartItem;

    } catch (error: any) {
        console.error("Error processing cart action:", error);
        // Handle specific Prisma error for "record not found"
        if (error.code === 'P2025') {
            throw createError({ statusCode: 404, message: 'Cart item not found.' });
        }
        throw createError({ statusCode: 500, message: 'Could not update your cart.' });
    }
});