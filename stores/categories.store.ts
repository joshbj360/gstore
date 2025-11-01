import { defineStore } from 'pinia';
import { useApiService } from '~/services/api/apiService';
import type { ICategory } from '~/models';
import { notify } from '@kyvg/vue3-notification';

// Set a 5-minute cache duration for categories
const CACHE_DURATION = 5 * 60 * 1000; 

export const useCategoryStore = defineStore('category', {
  state: () => ({
    categories: [] as ICategory[],
    isLoading: false,
    /**
     * This timestamp is the key to our "smart" cache.
     * It tracks when the categories were last fetched from the API.
     */
    lastFetched: 0 as number,
  }),

  actions: {
    /**
     * This is now a "smart" action that uses a time-based cache.
     * It will serve from the cache ONLY if the data is fresh.
     */
    async fetchCategories() {
      const now = Date.now();
      
      // 1. Check if we have fresh, cached data
      if (this.categories.length > 0 && (now - this.lastFetched) < CACHE_DURATION) {
        console.log('Serving categories from fresh cache.');
        return this.categories;
      }

      // 2. If cache is stale or empty, fetch from the API
      this.isLoading = true;
      console.log('Fetching stale categories from API...');
      try {
        const apiService = useApiService();
        // This should be your API endpoint to get all categories
        const data = await apiService.getAllCategories(); 
        
        if (Array.isArray(data)) {
          this.categories = data;
          this.lastFetched = now; // 3. Update the timestamp
        }
        return data;
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        notify({ type: 'error', text: 'Could not load product categories.' });
        return [];
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Creates a new category and then forces a refresh of the cache.
     */
    async addCategory(data: { name: string; thumbnailCatUrl: string }) {
      this.isLoading = true;
      try {
        const apiService = useApiService();
        const newCategory = await apiService.createCategory(data);
        
        // --- THE FIX ---
        // 1. Invalidate the Pinia cache by setting the timestamp to 0
        this.lastFetched = 0;
        
        // 2. Proactively refresh the `useAsyncData('layout-data')` cache
        // This will force `useLayoutData` to re-run.
        await refreshNuxtData('layout-data');
        
        notify({ type: 'success', text: 'Category created!' });
        return newCategory;
      } catch (error: any) {
        notify({ type: 'error', text: error.data?.message || 'Failed to create category.' });
      } finally {
        this.isLoading = false;
      }
    }
  }
});

