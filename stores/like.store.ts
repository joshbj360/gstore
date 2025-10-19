import { defineStore } from 'pinia';
import { useApiService } from '~/services/api/apiService';
import { useUserStore } from './user.store';

export const useLikeStore = defineStore('like', {
  state: () => ({
    // Use Sets for efficient O(1) lookups
    likedProductIds: new Set<number>(),
    likedCommentIds: new Set<string>(),
  }),
  actions: {
    /**
     * Fetches all of the current user's likes and populates the state.
     * This should be called once when the app initializes for a logged-in user.
     */
    async fetchUserLikes() {
      const userStore = useUserStore();
      if (!userStore.isLoggedIn) return;

      try {
        const apiService = useApiService();
        // You will need to create this API endpoint to fetch all user likes
        const userLikes = await apiService.getUserLikes(); 
        this.likedProductIds = new Set(userLikes.productLikes);
        this.likedCommentIds = new Set(userLikes.commentLikes);
      } catch (error) {
        console.error("Failed to fetch user likes:", error);
      }
    },

  /**
     * Toggles the like status for a product.
     */
    async toggleProductLike(productId: number) {
      const userStore = useUserStore();
      if (!userStore.isLoggedIn) {
          // Redirect to login or show a notification
          useRouter().push('/auth/login');
          return;
      }
      
      const apiService = useApiService();
      const originallyLiked = this.likedProductIds.has(productId);

      // Optimistic UI update for a snappy experience
      if (originallyLiked) {
        this.likedProductIds.delete(productId);
      } else {
        this.likedProductIds.add(productId);
      }

      try {
        // Send the request to the server in the background
        await apiService.toggleProductLike(productId);
      } catch (error) {
        console.error(`Failed to toggle like for product ${productId}:`, error);
        // If the API call fails, revert the optimistic update
        if (originallyLiked) {
            this.likedProductIds.add(productId);
        } else {
            this.likedProductIds.delete(productId);
        }
      }
    },

    /**
     * Toggles the like status for a comment.
     */
    async toggleCommentLike(commentId: string) {
        const apiService = useApiService();
        try {
            const { liked } = await apiService.toggleCommentLike(commentId);
            if (liked) {
                this.likedCommentIds.add(commentId);
            } else {
                this.likedCommentIds.delete(commentId);
            }
        } catch (error) {
            console.error(`Failed to toggle like for comment ${commentId}:`, error);
        }
    },
     /**
     * A handler for real-time updates to likes.
     * Called by the realtimeService.
     */
    _handleRealtimeLikeUpdate(payload: { eventType: string, new?: any, old?: any }) {
        const productStore = useProductStore();
        const record = payload.eventType === 'DELETE' ? payload.old : payload.new;
        if (!record || !record.product_id) return;

        const product = productStore.productMap.get(record.product_id);
        if (!product || !product.likes) return;

        // Directly manipulate the product's like count for instant UI updates
        if (payload.eventType === 'INSERT') {
            // A new like was added
            product.likes.push({
              userId: record.user_id, productId: record.product_id,
              id: 0,
              created_at: new Date(),
            });
        } else if (payload.eventType === 'DELETE') {
            // A like was removed
            const index = product.likes.findIndex(like => like.userId === record.user_id);
            if (index > -1) {
                product.likes.splice(index, 1);
            }
        }
        // Re-set the product in the map to trigger reactivity in components
        productStore.productMap.set(product.id!, { ...product });
    },
  },
});
