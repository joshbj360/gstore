import { defineStore } from 'pinia';
import { useUserStore, useProductStore } from '~/stores';
import { useApiService } from '~/services/api/apiService';
import { notify } from '@kyvg/vue3-notification';
import { useRouter } from 'vue-router';

export const useLikeStore = defineStore('like', {
  // THE FIX: State uses simple arrays, which are JSON-safe for persistence.
  state: () => ({
    _likedProductIds: [] as number[],
    _likedCommentIds: [] as string[],
    _likedPostIds: [] as string[], // NEW: For "Buyer Posts"
  }),

  getters: {
    // Getters convert the arrays to Sets on-the-fly for fast O(1) lookups.
    likedProductIds(state): Set<number> {
      return new Set(state._likedProductIds);
    },
    likedCommentIds(state): Set<string> {
      return new Set(state._likedCommentIds);
    },
    likedPostIds(state): Set<string> { // NEW: Getter for post likes
      return new Set(state._likedPostIds);
    },
  },

  actions: {
    reset() {
      this.$reset();
    },

    async fetchUserLikes(): Promise<{ productLikes: number[]; commentLikes: string[]; postLikes: string[] } | undefined> {
      const userStore = useUserStore();
      if (!userStore.isLoggedIn) 
      try {
        const apiService = useApiService();
        const userLikes = await apiService.getUserLikes(); 
        this._likedProductIds = userLikes.productLikes.map((p: any) => p.productId);
        this._likedCommentIds = userLikes.commentLikes.map((c: any) => c.commentId);
        this._likedPostIds = userLikes.postLikes.map((p: any) => p.postId); // NEW: Populate post likes
        return userLikes;
      } catch (error) {
        console.error("Failed to fetch user likes:", error);
      }
    },

    async toggleProductLike(productId: number) {
      const userStore = useUserStore();
      if (!userStore.isLoggedIn) return useRouter().push('/auth/login');
      
      const apiService = useApiService();
      const originallyLiked = this.likedProductIds.has(productId); // Use getter

      // Optimistic update
      if (originallyLiked) {
        this._likedProductIds = this._likedProductIds.filter(id => id !== productId);
      } else {
        this._likedProductIds.push(productId);
      }
      try {
        await apiService.toggleProductLike(productId);
      } catch (error) {
        // Revert on failure
        if (originallyLiked) this._likedProductIds.push(productId);
        else this._likedProductIds = this._likedProductIds.filter(id => id !== productId);
        notify({ type: 'error', text: 'Failed to update like.' });
      }
    },

    async toggleCommentLike(commentId: string) {
        // ... (implementation remains the same)
    },

    /**
     * NEW: Toggles the like status for a "Post" optimistically.
     */
    async togglePostLike(postId: string) {
      const userStore = useUserStore();
      if (!userStore.isLoggedIn) return useRouter().push('/auth/login');

      const apiService = useApiService();
      const originallyLiked = this.likedPostIds.has(postId); // Use getter

      // Optimistic update
      if (originallyLiked) {
        this._likedPostIds = this._likedPostIds.filter(id => id !== postId);
      } else {
        this._likedPostIds.push(postId);
      }

      try {
        await apiService.togglePostLike(postId);
      } catch (error) {
        // Revert on failure
        if (originallyLiked) this._likedPostIds.push(postId);
        else this._likedPostIds = this._likedPostIds.filter(id => id !== postId);
        notify({ type: 'error', text: 'Failed to like post.' });
      }
    },
    
    _handleRealtimeLikeUpdate(payload: { eventType: string, new?: any, old?: any }) {
        const productStore = useProductStore();
        const record = payload.eventType === 'DELETE' ? payload.old : payload.new;
        if (!record || !record.product_id) return;

        const product = productStore.productMap.get(record.product_id);
        if (!product || !product.likes) return;

        if (payload.eventType === 'INSERT') {
            product.likes.push({
              userId: record.user_id, productId: record.product_id,
              id: 0, // These values are just for the UI, don't need to be exact
              created_at: new Date(),
            });
        } else if (payload.eventType === 'DELETE') {
            const index = product.likes.findIndex(like => like.userId === record.user_E_id);
            if (index > -1) {
                product.likes.splice(index, 1);
            }
        }
        productStore.productMap.set(product.id!, { ...product });
    },
  },
  
  persist: true,
});

