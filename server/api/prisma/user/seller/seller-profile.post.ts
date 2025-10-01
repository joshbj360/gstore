import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';
import { ISellerProfile } from '~/models';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const body = await readBody(event);
    if (!body.store_name || !body.store_slug) {
        throw createError({ statusCode: 400, message: 'Store name is required.' });
    }

    try {
        // Use a transaction to ensure both operations succeed or fail together
        const [sellerProfile] = await prisma.$transaction<ISellerProfile[]>([
            prisma.sellerProfile.create({
                data: {
                    profileId: user.id,
                    store_name: body.store_name,
                    store_slug: body.store_slug,
                    store_description: body.store_description,
                    store_logo: body.store_logo,
                    store_banner: body.store_banner,
                    store_location: body.store_location,
                    store_phone: body.store_phone,
                    store_website: body.store_website,
                    store_socials: body.store_socials || {},
                }
            }),
            prisma.profile.update({
                where: { id: user.id },
                data: { role: 'seller' }
            })
        ]);
        return sellerProfile;
    } catch (error) {
        console.error("Error creating seller profile:", error);
        throw createError({ statusCode: 500, message: 'Could not create seller profile' });
    }
});