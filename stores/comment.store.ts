import { defineStore } from 'pinia';
import { useApiService } from '~/services/api/apiService';
import type { IComment } from '~/models';
import { notify } from '@kyvg/vue3-notification';

// This EventSource is managed here, outside of the reactive state.
let activeEventSource: EventSource | null = null;
// THE FIX: This now stores the cache key, e.g., "product-123" or "post-abc"
let currentCacheKey: string | null = null;

export const useCommentStore = defineStore('comment', {
  state: () => ({
    // THE FIX: The cache key is now a string to support "product-ID" and "post-ID"
    commentsCache: new Map<string, IComment[]>(),
    isLoading: {
      posting: false,
      fetching: false,
    },
    isConnected: false, 
  }),

  actions: {
    /**
     * A handler for real-time updates.
     */
     _handleRealtimeCommentUpdate(payload: { new?: any, old?: any }) {
        const record = payload.new || payload.old;
        if (!record) return;

        // THE FIX: Check for productId OR postId to find the correct cache
        const key = record.productId ? `product-${record.productId}` : record.postId ? `post-${record.postId}` : null;
        
        if (key && this.commentsCache.has(key)) {
          console.log(`SSE: Comment update for ${key}. Forcing refresh.`);
          // When a change is detected, force a refresh of the comments for that item.
          this.fetchComments(record.productId || record.postId, record.productId ? 'product' : 'post', true);
        }
     },

    /**
     * Fetches comments for a product OR a post, with an option to force a refresh.
     */
    async fetchComments(id: number | string, type: 'product' | 'post', forceRefresh = false) {
      const key = `${type}-${id}`;
      
      if (this.commentsCache.has(key) && !forceRefresh) {
        return;
      }
      this.isLoading.fetching = true;
      try {
        const apiService = useApiService();
        let comments: IComment[] = [];
        
        // THE FIX: Call the correct API based on type
        if (type === 'product') {
          comments = await apiService.getProductComments(id as number);
        } else {
          comments = await apiService.getPostComments(id as string);
        }
        
        this.commentsCache.set(key, comments);
      } catch (error) {
        console.error(`Failed to fetch comments for ${key}:`, error);
      } finally {
        this.isLoading.fetching = false;
      }
    },

    /**
     * Posts a new comment to either a product or a post.
     */
    async postComment(payload: { text: string; parentId?: string | null; productId?: number | null; postId?: string | null; }) {
      this.isLoading.posting = true;
      try {
        const apiService = useApiService();
        // The API is now polymorphic and accepts this payload
        await apiService.createComment(payload);
        return true;
      } catch (error: any) {
        notify({ type: 'error', text: error.data?.message || 'Could not post your comment.' });
        return false;
      } finally {
        this.isLoading.posting = false;
      }
    },

    /**
     * Connects to the SSE for a specific product's or post's comments.
     */
    subscribeToComments(id: number | string, type: 'product' | 'post') {
      const key = `${type}-${id}`;
      
      if (activeEventSource && currentCacheKey === key) {
        return;
      }
      
      if (activeEventSource) {
        this.unsubscribeFromComments();
      }

      console.log(`Subscribing to comment events for ${key}...`);
      currentCacheKey = key;
      
      // THE FIX: Connect to the correct SSE endpoint based on type
      // NOTE: This assumes you will create the 'subscribe-by-post-id' endpoint
      const endpoint = type === 'product'
        ? `/api/prisma/comments/subscribe-by-product-id/${id}`
        : `/api/prisma/comments/subscribe-by-post-id/${id}`; // This is the new endpoint you must create

      activeEventSource = new EventSource(endpoint);

      activeEventSource.onopen = () => {
        this.isConnected = true;
        console.log(`SSE connection opened for ${key}.`);
      };

      activeEventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'UPDATE') {
          this._handleRealtimeCommentUpdate(data.payload);
        }
      };

      activeEventSource.onerror = (error) => {
        console.error(`SSE error for ${key}:`, error);
        this.isConnected = false;
        activeEventSource?.close();
      };
    },

    /**
     * Closes the SSE connection.
     */
    unsubscribeFromComments() {
      if (activeEventSource) {
        activeEventSource.close();
        activeEventSource = null;
        this.isConnected = false;
        console.log(`Unsubscribed from comments for ${currentCacheKey}.`);
        currentCacheKey = null;
      }
    },
  },
});