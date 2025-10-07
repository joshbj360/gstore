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
     * Subscribes to real-time comment updates for a specific product.
     */
    subscribeToComments(productId: number) {
        if (activeChannel) {
            this.unsubscribeFromComments();
        }

        const supabase = useSupabaseClient();

        activeChannel = supabase
            .channel('public:Comment') // Subscribe to the entire table
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'Comment',
            },
            (payload) => {
                console.log('Real-time update received for Comment table:', payload);
                
                // THE FIX: We now filter the event on the client-side.
                // Check if the new comment belongs to the product we are currently viewing.
                const relevantProductId = payload.new?.productId || payload.old?.productId;
                if (relevantProductId === productId) {
                    console.log(`Update is relevant for product ${productId}. Refreshing comments.`);
                    // If it matches, force a refresh of the comments for this product.
                    this.fetchComments(productId, true); 
                }
            })
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`Successfully subscribed to real-time comments.`);
                    this.isConnected = true;
                }
                if (err) {
                    console.error(`Error subscribing to channel:`, err);
                    this.isConnected = false;
                }
            });
    },

    /**
     * Closes the active real-time connection.
     */
    unsubscribeFromComments() {
        if (activeChannel) {
            useSupabaseClient().removeChannel(activeChannel);
            activeChannel = null;
            this.isConnected = false;
            console.log('Unsubscribed from comment stream.');
        }
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

