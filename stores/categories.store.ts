import { defineStore } from 'pinia';
import type { ICategory } from '~/models';
import { useApiService } from '~/services/api/apiService';
import { notify } from "@kyvg/vue3-notification";

export const useCategoryStore = defineStore('category', {
  state: () => ({
    categories: [] as ICategory[],
    isLoading: false,
  }),
  
  getters: {
    // A simple getter to access the list of categories
    getCategories: (state) => state.categories,
  },

  actions: {
    /**
     * Fetches all categories from the API, but only if they haven't been loaded yet.
     * This prevents redundant network calls.
     */
    async fetchCategories() {
      // If categories are already in the state, don't fetch them again.
      if (this.categories.length > 0) {
        return;
      }

      this.isLoading = true;
      try {
        const apiService = useApiService();
        const data = await apiService.getAllCategories();
        if (Array.isArray(data)) {
          this.categories = data;
        }
        return data;
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        notify({ type: 'error', text: 'Could not load product categories.' });
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Adds a new category by calling the API and then adds the new category
     * to the local state for an immediate UI update.
     * @param category - The category object to create.
     */
    async addCategory(category: { name: string; thumbnailCatUrl: string }) {
      this.isLoading = true;
      try {
        const apiService = useApiService();
        const newCategory = await apiService.createCategory(category);

        if (newCategory) {
          // Add the newly created category to the state for instant UI updates
          this.categories.push(newCategory);
          notify({ type: 'success', text: `Category "${newCategory.name}" created!` });
          return newCategory;
        }
      } catch (err: any) {
        console.error('Failed to add category:', err);
        notify({ type: 'error', text: err.data?.message || 'Failed to create category.' });
        throw err;
      } finally {
        this.isLoading = false;
      }
    },
  },

  persist: true
});
