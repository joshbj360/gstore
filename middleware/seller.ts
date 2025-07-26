import { defineNuxtRouteMiddleware, navigateTo } from '#app';
import { useSupabaseClient } from '#imports';
import type { Database } from '~/types/supabase';

export default defineNuxtRouteMiddleware(async (to, from) => {
  const supabase = useSupabaseClient<Database>();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return navigateTo('/auth/login', { replace: true });

  const { data: profile, error } = await supabase
    .from('Profile') // Match schema
    .select('id, role')
    .eq('id', user.id) // Use 'id' as per your schema
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return navigateTo('/auth/login', { replace: true }); // Fallback on error
  }

  if (profile?.role !== 'seller') return navigateTo('/', { replace: true });

  return;
});