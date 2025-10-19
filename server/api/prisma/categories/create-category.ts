import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';
import { z } from 'zod';

// Define a strict schema for the expected request body.
const categoryCreateSchema = z.object({
    name: z.string().min(1, "Category name is required").max(100, "Category name is too long"),
    thumbnailCatUrl: z.string().url("Thumbnail must be a valid URL"),
});

export default defineEventHandler(async (event) => {
    // THE FIX: The call to serverSupabaseUser must be awaited.
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({ statusCode: 401, message: 'Unauthorized' });
    }

    // THE FIX: Add a security check to ensure only sellers can create categories.
    const userProfile = await prisma.profile.findUnique({ where: { id: user.id } });
    if (userProfile?.role !== 'seller') {
        throw createError({ statusCode: 403, message: 'Only sellers can create new categories.' });
    }

    // Use `readValidatedBody` for automatic, type-safe validation.
    const validation = await readValidatedBody(event, body => categoryCreateSchema.safeParse(body));
    if (!validation.success) {
        throw createError({ 
            statusCode: 400, 
            statusMessage: 'Invalid category data',
            message: validation.error.issues.map(i => i.message).join(', ')
        });
    }

    const { name, thumbnailCatUrl } = validation.data;

    try {
        // THE FIX: This is the correct way to use a Prisma transaction.
        // The Prisma Client Extension will automatically generate the slug.
        const newCategory = await prisma.category.create({
            data: {
                name: name,
                thumbnailCatUrl: thumbnailCatUrl,
                slug: '', // Provide a dummy value for the extension
            }
        });
        return newCategory;

    } catch (error: any) {
        console.error('Error creating category:', error);
        // Handle cases where the category name is not unique
        if (error.code === 'P2002') {
            throw createError({ statusCode: 409, message: 'A category with this name already exists.' });
        }
        throw createError({ statusCode: 500, message: 'Failed to create category.' });
    }
});
