import { defineStore } from "pinia";
import { useApiService } from "~/services/api/apiService"; // The central service for API calls
import type { IProduct, ISellerProfile } from "~/models"; // Use your project's main interface export
import { notify } from "@kyvg/vue3-notification";

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useProductStore = defineStore('product', {
  state: () => ({
    products: [] as IProduct[],
    productMap: new Map<number, IProduct>(),
    feedCache: new Map<string, IProduct[]>(),
    categoryCache: new Map<string, IProduct[]>(),
    sellerProductCache: new Map<string, IProduct[]>(),
    similarProductCache: new Map<number, IProduct[]>(),
    lastFetched: new Map<string | number, number>(),

    // UI State
    isLoading: false,
    hasMoreProducts: true,
    currentCategorySlug: null as string | null,
    currentProductSlug: null as string | null,
  }),

  getters: {
    // This is now the single source of truth for the product feed
    MainProductFeed: (state) => state.products,
    
    /**
     * THE FIX: This is the new, single source of truth for the current product.
     * It reactively finds the product in the cache based on the current slug.
     */
    currentProduct(state): IProduct | null {
      if (!state.currentProductSlug) return null;
      //  This can find the product in either the master list or just the map
      const product = state.productMap.get(
        state.products.find(p => p.slug === state.currentProductSlug)?.id || -1
      );
      return product || null;
    },
    /**
     * This getter derives the current seller's profile based on the current product.
     * It creates a reactive chain: slug changes -> product changes -> seller changes.
     */
    currentSellerProfile(state): ISellerProfile | null {
      const userStore = useUserStore();
      const product = this.currentProduct;
      if (!product || !product.store_slug) return null;
      return userStore.sellerCache.get(product.store_slug) || null;
    },
    activeProductList: (state) => {
      if (state.currentCategorySlug) {
        return state.categoryCache.get(state.currentCategorySlug) || [];
      }
      return state.products;
    },
    getProductById: (state) => (id: number) => {
      return state.productMap.get(id);
    },
  },

  actions: {


    /**
     * A private helper to add new products to all relevant caches.
     */
    _cacheProducts(productsToCache: IProduct[], categorySlug?: string) {
      productsToCache.forEach(product => {
        if (!this.productMap.has(product.id!)) {
          // Add to the main products array only if it's new
          this.products.push(product);
        }
        // Always update the map with the latest product data
        this.productMap.set(product.id!, product);
      });

      if (categorySlug) {
        const existing = this.categoryCache.get(categorySlug) || [];
        const newProducts = productsToCache.filter(p => !existing.some(ep => ep.slug === p.slug));
        this.categoryCache.set(categorySlug, [...existing, ...newProducts]);
      }
    },

    /**
     * Fetches the initial list of products if the store is empty.
     * Called by useAsyncData on the main page.
     */
    async ensureInitialProductsLoaded() {
      const apiService = useApiService();
      if (this.products.length > 0) return this.products;
      this.isLoading = true;
      try {
        const data = await apiService.getAllProducts({ page: 1, limit: 20 });
        this._cacheProducts(data);
        this.hasMoreProducts = data.length === 20;
        return data
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Fetches all products for a given category slug if they aren't already cached.
     * This is designed to be called by `useAsyncData` on the category page.
     * It returns the list of products for that category.
     */
    async ensureCategoryProductsLoaded(slug: string): Promise<IProduct[]> {
      this.currentCategorySlug = slug;
      
      // If the category is already cached, return the cached data immediately.
      const cachedProducts = this.categoryCache.get(slug);
      if (cachedProducts) {
        return cachedProducts;
      }

      this.isLoading = true;
      try {
        const apiService = useApiService();
        const { products } = await apiService.getProductsByCategorySlug(slug);
        this._cacheProducts(products, slug);
        this.hasMoreProducts = products.length >= 20; // Assuming a limit
        return products; // Return the newly fetched products
      } finally {
        this.isLoading = false;
      }
    },
    /**
     * Fetches more products for the current view (all products or a specific category).
     * Used for infinite scrolling.
     */
    async fetchMoreProducts() {
      const apiService = useApiService();
      if (this.isLoading || !this.hasMoreProducts) return;
      this.isLoading = true;
      try {
        const currentList = this.activeProductList; // Use the getter for consistency
        const nextPage = Math.floor(currentList.length / 20) + 1;

        const newProducts = this.currentCategorySlug
          ? (await apiService.getProductsByCategorySlug(this.currentCategorySlug)).products
          : await apiService.getAllProducts({ page: nextPage, limit: 20 });

        if (newProducts.length > 0) {
          this._cacheProducts(newProducts, this.currentCategorySlug || undefined);
        }
        this.hasMoreProducts = newProducts.length === 20;
      } catch (error) {
        notify({ type: 'error', text: 'Could not load more products.' });
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Sets the current category slug for filtering.
     * This is called by the category page.
     */
    setCategoryFilter(slug: string | null) {
      this.currentCategorySlug = slug;
    },

    /**
     * Creates a new product via the API and adds it to the local cache.
     */
    async createProduct(productData: IProduct): Promise<IProduct | null> {
      const apiService = useApiService();
      this.isLoading = true;
      try {
        const newProduct = await apiService.createProduct(productData);
        this._cacheProducts([newProduct]);
        notify({ type: 'success', text: 'Product created successfully!' });
        return newProduct;
      } catch (error: any) {
        notify({ type: 'error', text: error.message || 'Failed to create product.' });
        return null;
      } finally {
        this.isLoading = false;
      }
    },
    /**
     * Fetches similar products and caches them.
     */
    async fetchAndCacheSimilarProducts(productId: number): Promise<IProduct[]> {
      const apiService = useApiService();
      const cacheKey = `similar_${productId}`;
      const cached = this.similarProductCache.get(productId);
      const lastFetchTime = this.lastFetched.get(cacheKey) || 0;

      if (cached && (Date.now() - lastFetchTime) < CACHE_DURATION) {
        return cached;
      }

      try {
        const similarProducts = await apiService.getSimilarProducts(productId);
        this.similarProductCache.set(productId, similarProducts);
        this.lastFetched.set(cacheKey, Date.now());
        return similarProducts;
      } catch (error) {
        console.error(`Failed to fetch similar products for ID ${productId}:`, error);
        return []; // Return empty array on error
      }
    },
    /**
     * NEW ACTION: Fetches products by a seller's store slug and caches them.
     */
    async getProductsByStoreSlug(slug: string): Promise<IProduct[]> {
      const apiService = useApiService();
      const cacheKey = `seller_${slug}`;
      const cached = this.sellerProductCache.get(slug);
      const lastFetchTime = this.lastFetched.get(cacheKey) || 0;

      if (cached && (Date.now() - lastFetchTime) < CACHE_DURATION) {
        return cached;
      }

      try {
        const products = await apiService.getProductsByStoreSlug(slug);
        this.sellerProductCache.set(slug, products);
        this.lastFetched.set(cacheKey, Date.now());
        // Also add these products to the global cache
        this._cacheProducts(products);
        return products;
      } catch (error) {
        console.error(`Failed to fetch products for store slug "${slug}":`, error);
        return [];
      }
    },
    async fetchProductById(id: number): Promise<IProduct> {
      const cachedProduct = this.productMap.get(id);
      if (cachedProduct) return cachedProduct;
      const apiService = useApiService();
      this.isLoading = true;
      try {
        const product = await apiService.getProductFeedById(id);
        this._cacheProducts([product]);
        return product;
      } catch (error) {
        console.error(`Failed to fetch product by ID ${id}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    /**
     * Fetches the feed, caches the products, sets the current slug, and returns the feed.
     */
    async ensureProductFeedLoaded(slug: string): Promise<IProduct[]> {
      this.currentProductSlug = slug;
      if (this.feedCache.has(slug)) {
          return this.feedCache.get(slug)!;
        }
      const apiService = useApiService();
      this.isLoading = true;
      try {
        
        const feed = await apiService.getProductFeedBySlug(slug);
        // This action's primary job is to MUTATE the state
        this.feedCache.set(slug, feed);
        this._cacheProducts(feed);
        return feed; // It also returns the data for flexibility
      } catch (error) {
        console.error(`Failed to load feed for slug "${slug}"`, error);
        this.products = []; // Reset on error
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    /**
     * Clears the current category filter to show all products.
     */
    clearCategoryFilter() {
      this.currentCategorySlug = null;
    },
  },
});