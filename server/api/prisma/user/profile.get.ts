import prisma from '~/server/prisma/prismaClient';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' });

  try {
    let profile = await prisma.profile.findUnique({
      where: { id: user.id },
      include: { sellerProfile: true },
    });

    // Auto-create a profile if one doesn't exist for the logged-in user
    if (!profile) {
      const username=user.user_metadata.user_name || user.email?.split('@')[0] || (user.user_metadata.full_name as string) || 'user';
      profile = await prisma.profile.create({
        data: {
          id: user.id,
          username: username,
          email: user.email!,
          role: 'user', // Default role
          avatar: `https://avatar.iran.liara.run/public/boy?username=${username}`
        },
        include: { sellerProfile: true },
      });
    }
    return profile;
  } catch (error) {
    console.error("Error fetching or creating user profile:", error);
    throw createError({ statusCode: 500, message: 'Could not fetch user profile' });
  }
});