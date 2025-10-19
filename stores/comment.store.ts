import { defineStore } from 'pinia';
import { useApiService } from '~/services/api/apiService';
import type { IComment } from '~/models';
import { notify } from '@kyvg/vue3-notification';
import { useSupabaseClient } from '#imports';
import type { RealtimeChannel } from '@supabase/supabase-js';

// The channel instance is managed here, outside of the reactive state.
let activeChannel: RealtimeChannel | null = null;

export const useCommentStore = defineStore('comment', {
  state: () => ({
    commentsCache: new Map<number, IComment[]>(),
    isLoading: {
      posting: false,
      fetching: false,
    },
    isConnected: false, 
  }),

  actions: {
      /**
     * A handler for real-time updates to comments.
     * Called by the realtimeService.
     */
    _handleRealtimeCommentUpdate(payload: { new?: any, old?: any }) {
        const record = payload.new || payload.old;
        if (!record || !record.product_id) return;
        
        console.log(`Comment update for product ${record.product_id}. Forcing a refresh.`);
        // When a change is detected, force a refresh of the comments for that product.
        this.fetchComments(record.product_id, true);
    },

    /**
     * Fetches comments for a product, with an option to force a refresh.
     */
    async fetchComments(productId: number, forceRefresh = false) {
      if (this.commentsCache.has(productId) && !forceRefresh) {
        return;
      }
      this.isLoading.fetching = true;
      try {
        const apiService = useApiService();
        const comments = await apiService.getProductComments(productId);
        this.commentsCache.set(productId, comments);
      } catch (error) {
        console.error(`Failed to fetch comments for product ${productId}:`, error);
      } finally {
        this.isLoading.fetching = false;
      }
    },

    /**
     * Posts a new comment.
     */
    async postComment(payload: { productId: number; text: string; parentId?: string | null }) {
      this.isLoading.posting = true;
      try {
        const apiService = useApiService();
        await apiService.createComment(payload);
        return true;
      } catch (error: any) {
        notify({ type: 'error', text: error.data?.message || 'Could not post your comment.' });
        return false;
      } finally {
        this.isLoading.posting = false;
      }
    },
  },
});

