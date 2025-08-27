import { defineStore } from "pinia";
import type { ProductInterface } from "~/models/interface/products/product.interface";

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DEFAULT_PAGE_LIMIT = 20;

export const useProductStore = defineStore('product', {
  state: () => ({
    products: [] as ProductInterface[],
    productMap: new Map<number, ProductInterface>(),
    categoryCache: new Map<string, ProductInterface[]>(),
    similarProductCache: new Map<number, ProductInterface[]>(),
    sellerProductCache: new Map<string, ProductInterface[]>(),
    lastFetched: new Map<string | number, number>(),
    currentCategory: null as string | null,
    currentProduct: null as ProductInterface | null,
    isLoading: false,
    DEFAULT_PAGE_LIMIT: 20,
    hasMoreProducts: false
  }),

  getters: {
    /**
     * Retrieves products for a given category SLUG from the cache.
     * If no slug is provided, it returns all products.
     */
     getProductsByCategory: (state) => (categorySlug?: string | null) => {
      if (!categorySlug) return state.products;
      return state.categoryCache.get(categorySlug) || [];
    },
    getSimilarProducts: (state) => (productId: number) => {
      const cachedSimilarProducts = state.similarProductCache.get(productId);
      if (cachedSimilarProducts && Date.now() - (state.lastFetched.get(productId) || 0) <= CACHE_DURATION) {
        return cachedSimilarProducts.slice(0, 4);
      }

      const fetchSimilarProducts = async () => {
        try {
          const data = await $fetch<ProductInterface[]>(`/api/prisma/products/get-similar-products-by-id/${productId}`);
          if (data) {
            state.similarProductCache.set(productId, data);
            state.lastFetched.set(productId, Date.now());
            return data.slice(0, 4);
          }
          return [];
        } catch (err) {
          console.error('Failed to fetch similar products:', err);
          return [];
        }
      };

      return fetchSimilarProducts();
    },
  },

  actions: {
    async initialize() {
      if (this.products.length === 0) {
        await this.fetchProducts();
      }
    },

    clearCategoryFilter() {
      this.currentCategory = null;
    },

    async getProductById(id: number) {
      const product = this.productMap.get(id);
      if (product && Date.now() - (this.lastFetched.get(id) || 0) <= CACHE_DURATION) {
        this.currentProduct = product;
        return product;
      }
      return this.fetchProductById(id);
    },

    async fetchProductById(id: number) {
      this.isLoading = true;
      try {
        const data = await $fetch<ProductInterface>(`/api/prisma/products/get-product-by-id/${id}`);
        if (data) {
          this.cacheProducts([data]);
          this.currentProduct = data;
          return data;
        }
        return undefined;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchProducts(page: number = 1, limit: number = DEFAULT_PAGE_LIMIT) {
      this.isLoading = true;
      try {
        const data = await $fetch<ProductInterface[]>('/api/prisma/products/get-all-products', {
          query: { page, limit },
        });
        if (data) {
          this.cacheProducts(data);
          this.hasMoreProducts = data.length === limit;
          return data;
        }
        return [];
      } catch (err) {
        console.error('fetchProducts error:', err);
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchMoreProducts(limit: number = DEFAULT_PAGE_LIMIT) {
      if (this.isLoading) return;
      this.isLoading = true;
      try {
        const currentProducts = this.currentCategory ? this.getProductsByCategory(this.currentCategory) : this.products;
        const nextPage = Math.floor(currentProducts.length / limit) + 1;

        const endpoint = this.currentCategory 
            ? `/api/prisma/products/get-products-by-category-slug/${this.currentCategory}`
            : '/api/prisma/products/get-all-products';

        const data = await $fetch<ProductInterface[]>(endpoint, {
          query: { page: nextPage, limit },
        });

        if (data) {
          this.cacheProducts(data, this.currentCategory ?? undefined);
          this.hasMoreProducts = data.length === limit;
        } else {
          this.hasMoreProducts = false;
        }
      } catch (err) {
        console.error('fetchMoreProducts error:', err);
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Filters products by a category SLUG.
     * Fetches from the API only if the category is not already cached.
     */
    async filterByCategory(slug: string | null) {
      if (!slug) {
        this.clearCategoryFilter();
        return;
      }
      
      this.currentCategory = slug;
      const isCached = this.categoryCache.has(slug);

      if (!isCached) {
        this.isLoading = true;
        try {
          // The API now returns both category details and products
          const { products } = await $fetch(`/api/prisma/products/get-products-by-category-slug/${slug}`) as { products: ProductInterface[] };

          if (products) {
            // The cacheProducts function will handle adding these to the correct cache
            this.cacheProducts(products, slug);
            this.hasMoreProducts = products.length === DEFAULT_PAGE_LIMIT;
          }
        } catch (error) {
            console.error(`Failed to fetch products for category ${slug}:`, error);
        } finally {
          this.isLoading = false;
        }
      }
    },

    async getProductsByStoreName(store_name: string) {
      const cachedProducts = this.sellerProductCache.get(store_name);
      if (cachedProducts && Date.now() - (this.lastFetched.get(store_name) || 0) <= CACHE_DURATION) {
        return cachedProducts;
      }

      this.isLoading = true;
      try {
        const data = await $fetch<ProductInterface[]>(`/api/prisma/products/get-products-by-storename/${store_name}`);
        if (data) {
          const products = data as ProductInterface[];
          this.sellerProductCache.set(store_name, products);
          this.lastFetched.set(store_name, Date.now());
          products.forEach(product => {
            if (product.id) {
              if (!this.productMap.has(product.id)) {
                this.productMap.set(product.id, product);
                this.products.push(product);
              }
            }
          });
          console.log('Products by store name:', products, 'source: [store/product.store.getProductByStoreName]');
          return products;
        }
        return [];
      } catch (err) {
        console.error('Failed to fetch products by store name:', err);
        return [];
      } finally {
        this.isLoading = false;
      }
    },

    async createProduct(completeProduct: ProductInterface): Promise<ProductInterface | null> {
      try {
        this.isLoading = true;
        const data = await $fetch<ProductInterface>('/api/prisma/products/create-product', {
          method: 'POST',
          body: completeProduct,
        });

        if (data) {
          this.cacheProducts([data]);
          return data;
        }
        return null;
      } catch (err) {
        console.error('Create product error:', err);
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

      /**
     * Caches products globally and by category SLUG.
     */
    cacheProducts(productsToCache: ProductInterface[], categorySlug?: string | null) {
      const validProducts = productsToCache.filter(p => p && typeof p.id === 'number');

      validProducts.forEach((product) => {
        // Update the global product map
        this.productMap.set(product.id!, product);
        
        // Add to the main products list if it's not already there
        if (!this.products.some(p => p.id === product.id)) {
            this.products.push(product);
        }
      });

      // If a category slug is provided, update the category-specific cache
      if (categorySlug) {
        const existing = this.categoryCache.get(categorySlug) || [];
        const newForCategory = validProducts.filter(p => !existing.some(ep => ep.id === p.id));
        this.categoryCache.set(categorySlug, [...existing, ...newForCategory]);
      }
    },
  }
})