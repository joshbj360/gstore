import { defineStore } from 'pinia';
import { useApiService } from '~/services/api/apiService';
import type { IReel } from '~/models'; // You would create an IReel interface

export const useReelsStore = defineStore('reels', {
  state: () => ({
    reels: [] as IReel[],
    currentPage: 1,
    hasMore: true,
    isLoading: false,
  }),
  actions: {
    async fetchInitialReels() {
      if (this.reels.length > 0) return this.reels; // Avoid re-fetching on client-side navigation
      this.isLoading = true;
      try {
        const apiService = useApiService();
        // You'll need to add a getReels method to your apiService
        const { reels, meta } = await apiService.getReels({ page: 1 });
        this.reels = reels;
        this.hasMore = meta.hasMore;
        this.currentPage = 1;
        return reels;
      } finally {
        this.isLoading = false;
      }
    },
    async fetchMoreReels() {
      if (this.isLoading || !this.hasMore) return;
      this.isLoading = true;
      try {
        const nextPage = this.currentPage + 1;
        const apiService = useApiService();
        const { reels, meta } = await apiService.getReels({ page: nextPage });
        this.reels.push(...reels);
        this.hasMore = meta.hasMore;
        this.currentPage = nextPage;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
