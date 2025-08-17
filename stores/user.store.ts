import { defineStore } from 'pinia';
import { useSupabaseClient } from '#imports';
import type { Database } from '~/types/supabase';
import type { UserInterface, UserProfileInterface, SellerStoreInterface } from '~/models/interface/auth/user.interface';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as UserInterface | null,
    userProfile: null as UserProfileInterface | null,
    seller: null as SellerStoreInterface | null,
    isLoggedIn: false,
    loading: false,
    error: null as string | null,
    sellerCache: new Map<string, SellerStoreInterface>(),
  }),
  getters: {
    isSeller(state): boolean {
      return state.userProfile?.role === 'seller' || false;
    },
  },
  actions: {
    async fetchUser(): Promise<boolean> {
      const supabase = useSupabaseClient<Database>();
      this.loading = true;
      this.error = null;

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        this.user = null;
        this.isLoggedIn = false;
        this.error = authError?.message || 'No user found';
        this.loading = false;
        return false;
      }

      this.user = {
        id: user.id,
        email: user.email,
        phone: user.phone,
        createdAt: user.created_at,
        lastSignIn: user.last_sign_in_at,
      };
      this.isLoggedIn = true;
      this.loading = false;
      return true;
    },

    async fetchUserAndProfile(): Promise<boolean> {
      const supabase = useSupabaseClient<Database>();
      this.loading = true;
      this.error = null;

      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          this.user = null;
          this.isLoggedIn = false;
          this.error = authError?.message || 'No user found';
          return false;
        }

        this.user = {
          id: user.id,
          email: user.email,
          phone: user.phone,
          createdAt: user.created_at,
          lastSignIn: user.last_sign_in_at,
        };
        this.isLoggedIn = true;

        let { data: profile, error } = await supabase
          .from('Profile')
          .select('id, email, role, avatar, username, created_at, updated_at')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          this.error = `Failed to fetch profile: ${error.message}`;
          throw error;
        }

        if (!profile) {
          const email = user.email ?? `user-${user.id}@example.com`;
          const { data: newProfile, error: insertError } = await supabase
            .from('Profile')
            .insert({
              id: user.id,
              email,
              role: 'client',
              avatar: null,
              username: null,
            })
            .select('id, email, role, avatar, username, created_at, updated_at')
            .single();

          if (insertError) {
            this.error = `Failed to create profile: ${insertError.message}`;
            throw insertError;
          }
          profile = newProfile;
        } else if (profile.email !== user.email) {
          const { data: updatedProfile, error: updateError } = await supabase
            .from('Profile')
            .update({ email: user.email, updated_at: new Date().toISOString() })
            .eq('id', user.id)
            .select('id, email, role, avatar, username, created_at, updated_at')
            .single();
          if (updateError) {
            this.error = `Failed to update profile: ${updateError.message}`;
            throw updateError;
          }
          profile = updatedProfile;
        }

        this.userProfile = profile as UserProfileInterface;
        return true;
      } catch (err) {
        this.error = 'Failed to initialize user and profile';
        this.user = null;
        this.userProfile = null;
        this.isLoggedIn = false;
        return false;
      } finally {
        this.loading = false;
      }
    },

    async fetchUserProfile(): Promise<boolean> {
      const supabase = useSupabaseClient<Database>();
      this.loading = true;
      this.error = null;

      if (!this.isLoggedIn || !this.user?.id) {
        this.error = 'Authentication required to fetch user profile';
        return false;
      }

      try {
        const { data: profile, error } = await supabase
          .from('Profile')
          .select('id, email, role, avatar, username, created_at, updated_at')
          .eq('id', this.user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          this.error = `Failed to fetch profile: ${error.message}`;
          throw error;
        }

        this.userProfile = profile as UserProfileInterface;
        return true;
      } catch (err) {
        this.error = 'Failed to fetch user profile';
        this.userProfile = null;
        return false;
      } finally {
        this.loading = false;
      }
    },

    async updateUserProfile(updates: Partial<UserProfileInterface>): Promise<boolean> {
      const supabase = useSupabaseClient<Database>();
      this.loading = true;
      this.error = null;

      if (!this.isLoggedIn || !this.user?.id) {
        this.error = 'Authentication required to update user profile';
        return false;
      }

      try {
        const { data, error } = await supabase
          .from('Profile')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', this.user.id)
          .select('id, email, role, avatar, username, created_at, updated_at')
          .single();

        if (error) {
          this.error = `Failed to update profile: ${error.message}`;
          throw error;
        }

        this.userProfile = data as UserProfileInterface;
        return true;
      } catch (err) {
        this.error = 'Failed to update user profile';
        return false;
      } finally {
        this.loading = false;
      }
    },

    async fetchSellerStoreByStoreName(store_name: string): Promise<boolean> {
      if (this.sellerCache.has(store_name)) {
        this.seller = this.sellerCache.get(store_name) as SellerStoreInterface
        return true;
      }
      const supabase = useSupabaseClient<Database>();
      this.loading = true;
      this.error = null;

      try {
        const { data: sellerProfile, error } = await supabase
          .from('SellerProfile') // Ensure correct table name
          .select('id, profileId, store_name, store_description, store_logo, store_banner, store_location, store_phone, store_website, store_socials, is_verified, verification_status, verification_reason, created_at, updated_at')
          .eq('store_name', store_name)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116: No rows found
          this.error = `Failed to load seller profile: ${error.message}`;
          throw error;
        }

        if (!sellerProfile) {
          this.error = 'Seller profile not found';
          this.seller = null;
          return false;
        }

        const sellerData = { ...sellerProfile } as SellerStoreInterface;
        this.sellerCache.set(store_name, sellerData)
        this.seller = sellerData
        return true;
      } catch (err) {
        this.error = 'Failed to load seller profile';
        this.seller = null;
        return false;
      } finally {
        this.loading = false;
      }
    },

    async fetchMyStore(): Promise<boolean> {
      const supabase = useSupabaseClient<Database>();
      this.loading = true;
      this.error = null;

      if (!this.isLoggedIn || !this.user?.id) {
        this.error = 'Authentication required to fetch seller profile';
        return false;
      }

      try {
        const { data: sellerProfile, error } = await supabase
          .from('SellerProfile')
          .select('id, profileId, store_name, store_description, store_logo, store_banner, store_location, store_phone, store_website, store_socials, is_verified, verification_status, verification_reason, created_at, updated_at')
          .eq('profileId', this.user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          this.error = `Failed to load seller profile: ${error.message}`;
          throw error;
        }

        if (!sellerProfile) {
          this.error = 'Seller profile not found';
          this.seller = null;
          return false;
        }

        this.seller = { ...sellerProfile } as SellerStoreInterface;
        return true;
      } catch (err) {
        this.error = 'Failed to load seller profile';
        this.seller = null;
        return false;
      } finally {
        this.loading = false;
      }
    },

    async createSellerProfile(data: {
      store_name?: string;
      store_description?: string;
      store_logo?: string;
      store_banner?: string;
      store_location?: string;
      store_phone?: string;
      store_website?: string;
      store_socials?: Record<string, any>;
    }): Promise<boolean> {
      const supabase = useSupabaseClient<Database>();
      this.loading = true;
      this.error = null;

      if (!this.isLoggedIn || !this.user?.id) {
        this.error = 'Authentication required to create seller profile';
        return false;
      }

      try {
        const { data: newSeller, error } = await supabase
          .from('SellerProfile')
          .insert({
            id: this.user.id,
            profileId: this.user.id,
            store_name: data.store_name ?? null,
            store_description: data.store_description ?? null,
            store_logo: data.store_logo ?? null,
            store_banner: data.store_banner ?? null,
            store_location: data.store_location ?? null,
            store_phone: data.store_phone ?? null,
            store_website: data.store_website ?? null,
            store_socials: data.store_socials ?? null,
            is_verified: false,
            verification_status: 'PENDING',
            verification_reason: null,
            updated_at: new Date().toISOString()
          })
          .select('id, profileId, store_name, store_description, store_logo, store_banner, store_location, store_phone, store_website, store_socials, is_verified, verification_status, verification_reason, created_at, updated_at')
          .single();

        if (error) {
          this.error = `Failed to create seller profile: ${error.message}`;
          throw error;
        }

        this.seller = { ...newSeller } as SellerStoreInterface;
        const { error: updateError } = await supabase
          .from('Profile')
          .update({ role: 'seller', updated_at: new Date().toISOString() })
          .eq('id', this.user.id);
        if (updateError) {
          this.error = `Failed to update user role: ${updateError.message}`;
          throw updateError;
        }
        this.userProfile!.role = 'seller';
        return true;
      } catch (err) {
        this.error = 'Failed to create seller profile';
        return false;
      } finally {
        this.loading = false;
      }
    },

    async logout(): Promise<void> {
      const supabase = useSupabaseClient<Database>();
      this.loading = true;
      this.error = null;

      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          this.error = `Failed to log out: ${error.message}`;
          throw error;
        }
      } catch (err) {
        this.error = 'Failed to log out';
      } finally {
        this.user = null;
        this.userProfile = null;
        this.seller = null;
        this.isLoggedIn = false;
        this.loading = false;
      }
    },


  },
});