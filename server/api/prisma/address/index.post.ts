import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';
import { z } from 'zod'; // Import Zod for schema validation

// Define a strict schema for the expected address data.
const addressSchema = z.object({
    name: z.string().min(2, 'Full name is required.'),
    address: z.string().min(5, 'A valid street address is required.'),
    state: z.string().min(2, 'State is required.'),
    country: z.string().min(2, 'Country is required.'),
    phone: z.string().min(5, 'A valid phone number is required.'),
    // Optional fields
    zipcode: z.string().min(5, 'A valid postal code is required.'),
    county: z.string().min(2, 'LGA/County is required.'),
});

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({ statusCode: 401, message: 'Unauthorized' });
    }

    // Use `readValidatedBody` to automatically parse and validate the request.
    // This will throw a descriptive 400 error if the data is invalid.
    const validation = await readValidatedBody(event, body => addressSchema.safeParse(body));
    
    if (!validation.success) {
        throw createError({ 
            statusCode: 400, 
            statusMessage: 'Invalid address data', 
            message: validation.error.issues.map(i => i.message).join(', ') 
        });
    }

    const addressData = validation.data;
    console.log('addressData:', addressData)

    // The `upsert` operation is perfect for "create or update" logic.
    const address = await prisma.addresses.upsert({
        where: { userId: user.id },
        update: {
            ...addressData,
            updated_at: new Date(),
        },
        create: {
            userId: user.id,
            updated_at: new Date(),
            ...addressData,
        },
    });

    return address;
});

