// stores/feed.store.ts
import { defineStore } from 'pinia';
import { useApiService } from '~/services/api/apiService';
import type { IFeedItem } from '~/models';
import { notify } from '@kyvg/vue3-notification';

export const useFeedStore = defineStore('feed', {
  state: () => ({
    mainFeed: [] as IFeedItem[],
    // FIX: Changed from currentPage to nextCursor
    nextCursor: null as string | null,
    hasMore: true,
    isLoading: false,
  }),
  actions: {
    /**
     * Sets the initial, unified feed for the homepage.
     */
    // FIX: Updated signature to accept meta object
    setInitialFeed(initialFeed: IFeedItem[], meta: { hasMore: boolean, nextCursor: string | null }) {
        this.mainFeed = initialFeed;
        // FIX: Set the cursor and hasMore from the initial load
        this.nextCursor = meta.nextCursor;
        this.hasMore = meta.hasMore;
    },

    /**
     * Fetches the next page of the unified feed for infinite scroll.
     */
    async fetchMoreFeedItems() {
        // FIX: Check for hasMore and nextCursor
        if (this.isLoading || !this.hasMore || !this.nextCursor) {
            if (!this.nextCursor && this.hasMore) {
                // This means we've reached the end
                this.hasMore = false;
            }
            return;
        }

        this.isLoading = true;
        try {
            const apiService = useApiService();
            // FIX: Pass the cursor to the API
            const { feed, meta } = await apiService.getHomeFeed({ 
                cursor: this.nextCursor, 
                limit: 10 
            });

            if (feed.length > 0) {
                this.mainFeed.push(...feed);
                // FIX: Update the cursor and hasMore from the response
                this.nextCursor = meta.nextCursor;
                this.hasMore = meta.hasMore;
            } else {
                this.hasMore = false;
                this.nextCursor = null;
            }
        } catch (error) {
             notify({ type: 'error', text: 'Could not load more items.' });
        } finally {
            this.isLoading = false;
        }
    },
  },
});