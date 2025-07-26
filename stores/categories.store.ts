import { defineStore } from 'pinia';
import type { CategoryInterface } from '~/models/interface/products/category.interface';
import type { ProductInterface } from '~/models/interface/products/product.interface';
import { useProductStore } from '~/stores/product.store'; // Import if needed

export const useCategoryStore = defineStore('category', {
  state: () => ({
    categories: [] as CategoryInterface[],
    categoryProductCache: new Map<number, ProductInterface[]>(), // Cache for similar products by categoryId
  }),
  actions: {
    async fetchCategories() {
      try {
        const { data } = await useFetch('/api/prisma/categories/get-all-categories');
        if (Array.isArray(data.value)) {
          this.categories = data.value as CategoryInterface[];

          // Pre-cache products for each category using categoryId
          this.categories.forEach(category => {
            if (category.id && category.products && Array.isArray(category.products)) {
              this.categoryProductCache.set(category.id, category.products);

            }
          });
        } else {
          this.categories = [];
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    },
    async addCategory(category: CategoryInterface) {
      try {
        const { data, error } = await useFetch('/api/prisma/categories/create-category', {
          method: 'POST',
          body: category,
        });
        if (error.value) throw new Error(error.value.message);
        if (data.value && typeof data.value === 'object' && 'id' in data.value && 'name' in data.value) {
          const newCategory = data.value as CategoryInterface;
          this.categories.push(newCategory);
          if (newCategory.id && newCategory.products && Array.isArray(newCategory.products)) {
            this.categoryProductCache.set(newCategory.id, newCategory.products);
          }
        }
      } catch (err) {
        console.error('Failed to add category:', err);
        throw err;
      }
    },
    // async getSimilarProducts(productId: number, categoryId?: number): Promise<ProductInterface[]> {
    //   const productStore = useProductStore();
    //   const product = productStore.productMap.get(productId);

    //   if (!product || !product.category?.length) return [];

    //   // Use provided categoryId or derive from product
    //   const effectiveCategoryId = categoryId || product.category[0].categoryId;

    //   let similarProducts = this.categoryProductCache.get(effectiveCategoryId);

    //   // Fallback to fetch if not in cache
    //   if (!similarProducts && this.categories.length) {
    //     const foundCategory = this.categories.find(c => c.id === effectiveCategoryId);
    //     similarProducts = foundCategory?.products || [];
    //     if (effectiveCategoryId && similarProducts && Array.isArray(similarProducts)) {
    //       this.categoryProductCache.set(effectiveCategoryId, similarProducts);
    //     }
    //   }

    //   // If still not found, fetch category products
    //   if (!similarProducts) {
    //     await this.fetchCategoryProducts(effectiveCategoryId);
    //     similarProducts = this.categoryProductCache.get(effectiveCategoryId) || [];
    //   }

    //   // Filter out the current product and limit to 4
    //   return similarProducts
    //     ?.filter(p => p.id !== productId)
    //     .slice(0, 4) || [];
    // },
    // Optional: Fetch category products if not pre-loaded
    async fetchCategoryProducts(categoryId: number) {
      try {
        const { data } = await useFetch<CategoryInterface>(
          `/api/prisma/categories/get-category-by-id/${categoryId}`,
          { params: { includeProducts: true } }
        );
        if (data.value && data.value.id && data.value.products && Array.isArray(data.value.products)) {
          this.categoryProductCache.set(data.value.id, data.value.products);
          // Update the category in categories array if it exists
          const index = this.categories.findIndex(c => c.id === categoryId);
          if (index !== -1) {
            this.categories[index] = { ...this.categories[index], ...data.value, products: data.value.products };
          }
        }
      } catch (err) {
        console.error('Failed to fetch category products:', err);
      }
    },
  },
});