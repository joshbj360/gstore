import { defineStore } from 'pinia';
import { useApiService } from '~/services/api/apiService';
import type { IReel } from '~/models';
import { notify } from '@kyvg/vue3-notification';

export const useReelsStore = defineStore('reels', {
  state: () => ({
    reels: [] as IReel[],
    currentPage: 1,
    hasMore: true,
    isLoading: false,
  }),

  actions: {
    /**
     * Fetches the first page of the unified Reels feed.
     */
    async fetchInitialReels(): Promise<IReel[]> {
      this.isLoading = true;
      try {
        const apiService = useApiService();
        const { reels, meta } = await apiService.getReels({ page: 1 });
        this.reels = reels;
        this.hasMore = meta.hasMore;
        this.currentPage = 1;
        return reels;
      } catch (error) {
        console.error("Failed to fetch initial reels:", error);
        notify({ type: 'error', text: 'Could not load reels.' });
        return [];
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Fetches the next page of reels for infinite scrolling.
     */
    async fetchMoreReels() {
      if (this.isLoading || !this.hasMore) return;

      this.isLoading = true;
      try {
        const nextPage = this.currentPage + 1;
        const apiService = useApiService();
        const { reels, meta } = await apiService.getReels({ page: nextPage });

        if (reels.length > 0) {
          this.reels.push(...reels);
          this.currentPage = nextPage;
          this.hasMore = meta.hasMore;
        } else {
          this.hasMore = false;
        }
      } catch (error) {
        notify({ type: 'error', text: 'Could not load more reels.' });
      } finally {
        this.isLoading = false;
      }
    },
  },
});

