import { defineStore } from 'pinia';
import { useApiService } from '~/services/api/apiService';
import type { IFeedItem } from '~/models';
import { notify } from '@kyvg/vue3-notification';

export const useFeedStore = defineStore('feed', {
  state: () => ({
    mainFeed: [] as IFeedItem[],
    currentPage: 1,
    hasMore: true,
    isLoading: false,
  }),
  actions: {
    /**
     * Sets the initial, unified feed for the homepage.
     */
    setInitialFeed(initialFeed: IFeedItem[]) {
        this.mainFeed = initialFeed;
        this.currentPage = 1;
        this.hasMore = initialFeed.length > 0;
    },

    /**
     * Fetches the next page of the unified feed for infinite scroll.
     */
    async fetchMoreFeedItems() {
        if (this.isLoading || !this.hasMore) return;

        this.isLoading = true;
        try {
            const nextPage = this.currentPage + 1;
            const apiService = useApiService();
            const { feed, meta } = await apiService.getHomeFeed({ page: nextPage, limit: 10 });

            if (feed.length > 0) {
                this.mainFeed.push(...feed);
                this.currentPage = nextPage;
                this.hasMore = meta.hasMore;
            } else {
                this.hasMore = false;
            }
        } catch (error) {
            notify({ type: 'error', text: 'Could not load more items.' });
        } finally {
            this.isLoading = false;
        }
    },
  },
});
