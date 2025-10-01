import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';

/**
 * @description Fetches the full profile for the currently authenticated user,
 * including their associated seller profile if it exists.
 * It will also auto-create a basic profile if one doesn't exist for the user.
 */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  try {
    let profile = await prisma.profile.findUnique({
      where: { id: user.id },
      include: { 
        sellerProfile: true // Include the nested seller profile data
      },
    });

    // If a user is authenticated but has no profile row yet, create one.
    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          id: user.id,
          email: user.email!,
          role: 'user', // All new profiles start as a standard user
        },
        include: { 
          sellerProfile: true 
        },
      });
    }
    
    return profile;

  } catch (error) {
    console.error("Error fetching or creating user profile:", error);
    throw createError({ statusCode: 500, message: 'Could not fetch user profile' });
  }
});
