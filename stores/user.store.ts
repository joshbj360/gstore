import { defineStore } from 'pinia';
import { useApiService } from "~/services/api/apiService";
import type { IProfile, ISellerProfile } from '~/models';
import { useSupabaseUser, useSupabaseClient } from '#imports';
import { notify } from "@kyvg/vue3-notification";
export const useUserStore = defineStore('user', {
  state: () => ({
    userProfile: null as IProfile | null,
    sellerProfile: null as ISellerProfile | null,
    sellerCache: {} as Record<string, ISellerProfile>,
    isLoading: false,
  }),

  getters: {
    // These getters provide direct, reactive access to the Supabase auth state
    isLoggedIn: () => !!useSupabaseUser().value,
    user: () => useSupabaseUser().value,
    
    isSeller(state): boolean {
      return state.userProfile?.role === 'seller';
    },
  },

  actions: {
    /**
     * The main action to call after any successful login.
     * It syncs the guest cart and fetches the user's full profile.
     */
    async _onLoginSuccess() {
        //const cartStore = useCartStore();
        this.isLoading = true;
      await Promise.all([
        //await cartStore.mergeAndSyncCartOnLogin(),
        await this.fetchUserAndProfile()

      ]);
      this.isLoading = false;
    },
    
    /**
     * Handles email/password sign-in.
     */
    async loginWithPassword(email: string, password: string) {
        const supabase = useSupabaseClient();
        this.isLoading = true;
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            await this._onLoginSuccess();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        } finally {
            this.isLoading = false;
        }
    },
    /**
     * Handles new user registration.
     */
    async registerWithPassword(email: string, password: string) {
        const supabase = useSupabaseClient();
        this.isLoading = true;
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
            });
            if (error) throw error;
            return { success: true, user: data.user };
        } catch (error: any) {
            return { success: false, error: error.message };
        } finally {
            this.isLoading = false;
        }
    },
    /**
     * Handles OAuth sign-in (e.g., Google, GitHub).
     */
    async loginWithOAuth(provider: 'google' | 'github') {
        const supabase = useSupabaseClient();
        this.isLoading = true;
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: { redirectTo: `${window.location.origin}/auth/callback` },
            });
            if (error) throw error;
        } catch (error: any) {
            notify({ type: 'error', text: error.message || `Failed to authenticate with ${provider}` });
        } finally {
            this.isLoading = false;
        }
    },
    /**
     * Fetches the current user's full profile from our backend.
     * This is the main action to call after a user logs in.
     */
    async fetchUserAndProfile() {
      if (!this.isLoggedIn || this.userProfile) return; // Don't fetch if not logged in or already have a profile

      const apiService = useApiService();
      this.isLoading = true;
      try {
        const profile = await apiService.getUserProfile();
        this.userProfile = profile;
        if (profile.sellerProfile) {
          this.sellerProfile = profile.sellerProfile;
        }
      } catch (error) {
        console.error("Failed to fetch user profile via API:", error);
      } finally {
        this.isLoading = false;
      }
    },
    
    /**
     * Creates a new seller profile by calling our backend API.
     */
    async createSellerProfile(data: Partial<ISellerProfile>) {
        const apiService = useApiService();
        this.isLoading = true;
        try {
            const newSellerProfile = await apiService.createSellerProfile(data);
            this.sellerProfile = newSellerProfile;
            if(this.userProfile) {
                this.userProfile.role = 'seller'; // Optimistically update the role
            }
            return true;
        } catch (error) {
            console.error("Failed to create seller profile:", error);
            return false;
        } finally {
            this.isLoading = false;
        }
    },

    /**
     * Fetches a seller's public profile if it's not already in the cache.
     */
    async ensureSellerProfileLoaded(slug: string) {
      if (!slug || this.sellerCache[slug]) {
        return; // Already have it cached
      }

      const apiService = useApiService();
      try {
        const sellerData = await apiService.getSellerProfileBySlug(slug);
        if (sellerData) {
          this.sellerCache[slug] = sellerData;
        }
      } catch (error) {
        console.error(`Failed to fetch seller profile for ${slug}:`, error);
      }
    },

    /**
     * Logout still uses the Supabase client directly, as it's a client-side auth action.
     */
    async logout() {
      const supabase = useSupabaseClient();
      await supabase.auth.signOut();
      this.userProfile = null;
      this.sellerProfile = null;
      this.sellerCache = {};
      this.reset()
    },
     /**
     * Resets the store to its initial, unauthenticated state.
     */
    reset() {
      // $reset() is a built-in Pinia method that re-calls the state function
      this.$reset();
    },

  },
  persist: true
});

