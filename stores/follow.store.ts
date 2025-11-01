import { defineStore } from 'pinia';
import {  useUserStore } from '~/stores';
import { useApiService } from '~/services/api/apiService';
import { notify } from '@kyvg/vue3-notification';
import { useRouter } from 'vue-router';

export const useFollowStore = defineStore('follow', {
  // THE FIX: The state now uses a simple array, which is JSON-safe.
  state: () => ({
    _followedSellerIds: [] as string[],
  }),

  getters: {
    // THE FIX: A getter converts the array to a Set on-the-fly.
    // Components will use this for fast O(1) lookups.
    followedSellerIds(state): Set<string> {
      return new Set(state._followedSellerIds);
    },
  },

  actions: {
    /**
     * Resets the follow state to its initial, empty state.
     */
    reset() {
      this.$reset();
    },

    /**
     * Fetches all sellers the current user follows.
     */
    async fetchUserFollows() {
      const userStore = useUserStore();
      if (!userStore.isLoggedIn) return;
      try {
        const apiService = useApiService();
        const followedSellers = await apiService.getUserFollows(); 
        this._followedSellerIds = followedSellers.map((f: any) => f.followingId);
      } catch (error) {
        console.error("Failed to fetch user follows:", error);
      }
    },

    /**
     * Toggles the follow status for a seller profile optimistically.
     */
    async toggleFollow(sellerProfileId: string) {
      const userStore = useUserStore();
      if (!userStore.isLoggedIn) {
        useRouter().push('/auth/login');
        return;
      }
      
      const apiService = useApiService();
      // We check against the array using .includes()
      const originallyFollowed = this._followedSellerIds.includes(sellerProfileId);

      // Optimistic UI update
      if (originallyFollowed) {
        this._followedSellerIds = this._followedSellerIds.filter(id => id !== sellerProfileId);
      } else {
        this._followedSellerIds.push(sellerProfileId);
      }

      try {
        await apiService.toggleFollow(sellerProfileId);
      } catch (error) {
        // Revert on failure
        if (originallyFollowed) {
          this._followedSellerIds.push(sellerProfileId);
        } else {
          this._followedSellerIds = this._followedSellerIds.filter(id => id !== sellerProfileId);
        }
        notify({ type: 'error', text: 'Failed to update follow status.' });
      }
    },
  },
  
  persist: true,
});

