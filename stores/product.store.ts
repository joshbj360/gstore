import { defineStore } from 'pinia';
import {useUserStore } from '~/stores';
import { useApiService } from '~/services/api/apiService';
import type { IProduct, IReel, IMedia, ISellerProfile, IProductVariant, IFeedItem } from '~/models';
import { notify } from '@kyvg/vue3-notification';

export const useProductStore = defineStore('product', {
  state: () => ({
    /**
     * Holds the main, unified social feed for the homepage (mix of Posts and Products).
     */
    mainFeed: [] as IFeedItem[],
    /**
     * Holds the paginated list of products for the "Discover" or "Category" pages.
     */
    products: [] as IProduct[],
    /**
     * A global, high-performance cache (Map) of all products loaded in the app, keyed by product ID.
     */
    productMap: new Map<number, IProduct>(),
    
    // --- Pagination State ---
    // We need separate pagination for the feed vs. the discover page
    feedCurrentPage: 1,
    feedHasMore: true,
    discoverCurrentPage: 1,
    discoverHasMore: true,
    
    currentCategorySlug: 'all', // For the discover page
    isLoading: false,
    
    /**
     * The slug of the product currently being viewed in the swipeable feed.
     */
    currentProductSlug: null as string | null,
  }),

  getters: {
    /**
     * Reactively gets the full product object for the currently viewed product.
     */
    currentProduct(state): IProduct | null {
      if (!state.currentProductSlug) return null;
      
      // 1. Try to find it in the mainFeed
      const feedItem = state.mainFeed.find(item => item.type === 'PRODUCT' && item.product?.slug === state.currentProductSlug);
      if (feedItem && feedItem.product) return feedItem.product;

      // 2. Fallback to checking the productMap
      return Array.from(state.productMap.values()).find(p => p.slug === state.currentProductSlug) || null;
    },
    
    /**
     * Reactively gets the seller profile for the currently viewed product.
     */
    currentSellerProfile(state): ISellerProfile | null {
      const userStore = useUserStore();
      if (!this.currentProduct || !this.currentProduct.seller) return null;
      
      // Read from the userStore's cache for consistency
      return userStore.sellerCache[this.currentProduct.seller.store_slug] || this.currentProduct.seller;
    }
  },

  actions: {
    /**
     * Internal helper to add products to the high-performance cache.
     */
    _cacheProducts(productsToCache: IProduct[]) {
      productsToCache.forEach(product => {
        if (product && product.id) {
          // Store the full product object by its ID
          this.productMap.set(product.id, { ...this.productMap.get(product.id), ...product });
        }
      });
    },

    /**
     * Sets the initial, unified feed for the homepage.
     */
    setInitialFeed(initialFeed: IFeedItem[]) {
        this.mainFeed = initialFeed;
        const products = initialFeed
          .filter((item): item is IFeedItem & { product: IProduct } => item.type === 'PRODUCT' && !!item.product)
          .map(item => item.product);
        this._cacheProducts(products);
        this.feedCurrentPage = 1;
        this.feedHasMore = initialFeed.length > 0;
    },

    /**
     * Fetches the next page of the unified feed for the homepage's infinite scroll.
     */
    async fetchMoreFeedItems() {
        if (this.isLoading || !this.feedHasMore) return;
        this.isLoading = true;
        try {
            const nextPage = this.feedCurrentPage + 1;
            const apiService = useApiService();
            const { feed, meta } = await apiService.getHomeFeed({ page: nextPage, limit: 10 });

            if (feed.length > 0) {
                this.mainFeed.push(...feed);
                const products = feed
                  .filter((item): item is IFeedItem & { product: IProduct } => item.type === 'PRODUCT' && !!item.product)
                  .map(item => item.product);
                this._cacheProducts(products);
                this.feedCurrentPage = nextPage;
                this.feedHasMore = meta.hasMore;
            } else {
                this.feedHasMore = false;
            }
        } finally {
            this.isLoading = false;
        }
    },

    /**
     * Fetches the first page of products for a specific category (or 'all') for the Discover page.
     * This action RESETS the products list.
     */
    async fetchProductsForCategory(slug: string): Promise<IProduct[]> {
        this.isLoading = true;
        this.currentCategorySlug = slug;
        this.discoverCurrentPage = 1;
        try {
            const apiService = useApiService();
            const { products, meta } = await apiService.getProductsByCategorySlug_Paginated(slug, { page: 1 });
            this.products = products;
            this._cacheProducts(products);
            this.discoverHasMore = meta.hasMorePages;
            return products;
        } catch (error) {
            notify({ type: 'error', text: 'Could not load products.' });
            return [];
        } finally {
            this.isLoading = false;
        }
    },

    /**
     * Fetches the *next* page of products for the *current* category (for the Discover page).
     */
    async fetchMoreProducts() {
        if (this.isLoading || !this.discoverHasMore) return;
        this.isLoading = true;
        try {
            const nextPage = this.discoverCurrentPage + 1;
            const apiService = useApiService();
            const { products, meta } = await apiService.getProductsByCategorySlug_Paginated(this.currentCategorySlug, { page: nextPage });

            if (products.length > 0) {
                const newProducts = products.filter(p => !this.productMap.has(p.id!));
                this.products.push(...newProducts);
                this._cacheProducts(newProducts);
                this.discoverCurrentPage = nextPage;
                this.discoverHasMore = meta.hasMorePages;
            } else {
                this.discoverHasMore = false;
            }
        } catch (error) {
            notify({ type: 'error', text: 'Could not load more products.' });
        } finally {
            this.isLoading = false;
        }
    },
    
    /**
     * Creates a new product using the two-step (draft + update) process.
     */
    async createProduct(fullProductData: IProduct): Promise<IProduct | null> {
        const apiService = useApiService();
        const userStore = useUserStore();
        this.isLoading = true;
        
        let newDraftProduct: IProduct | null = null;
        try {
            // --- STEP 1: The "Quick" Call ---
            newDraftProduct = await apiService.createProductDraft({ 
                title: fullProductData.title, 
                media: fullProductData.media 
            });
            if (!newDraftProduct || !newDraftProduct.id) {
                throw new Error('Failed to create product draft.');
            }

            // --- Optimistic Update ---
            const newFeedItem: IFeedItem = {
                id: `product-${newDraftProduct.id}`,
                type: 'PRODUCT',
                created_at: new Date(),
                author: {
                    id: userStore.user!.id,
                    username: userStore.sellerProfile?.store_name ?? undefined,
                    avatar: userStore.sellerProfile?.store_logo ?? undefined,
                    role: 'seller',
                },
                media: newDraftProduct.media[0] ?? undefined,
                caption: newDraftProduct.title,
                likeCount: 0,
                taggedProducts: [newDraftProduct],
                product: newDraftProduct,
            };
            this.mainFeed.unshift(newFeedItem);
            this.productMap.set(newDraftProduct.id, newDraftProduct);
            
            // --- STEP 2: The "Heavy" Call (Fire-and-Forget) ---
            apiService.updateProductDetails(newDraftProduct.id, fullProductData)
                .then(updatedProduct => {
                    console.log(`Product ${updatedProduct.id} details successfully updated.`);
                    this._cacheProducts([updatedProduct]);
                })
                .catch(err => {
                    console.error(`BACKGROUND_UPDATE_FAILED for product ${newDraftProduct?.id}:`, err);
                });

            return newDraftProduct;

        } catch (error: any) {
            console.error('Error in createProduct (Store):', error);
            notify({ type: 'error', text: error.data?.message || 'Failed to create product.' });
            return null;
        } finally {
            this.isLoading = false;
        }
    },

    /**
     * Fetches a single product by its slug.
     * Uses the cache first for high performance.
     */
    async getProductBySlug(slug: string): Promise<IProduct | null> {
      const cachedProduct = Array.from(this.productMap.values()).find(p => p.slug === slug);
      if (cachedProduct) return cachedProduct;

      const apiService = useApiService();
      this.isLoading = true;
      try {
        const product = await apiService.getProductBySlug(slug);
        this._cacheProducts([product]);
        return product;
      } catch (error) {
        console.error(`Failed to fetch product by slug "${slug}":`, error);
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Fetches the full, swipeable feed for a specific product.
     */
    async fetchProductFeedForSlug(slug: string): Promise<IProduct[]> {
      const apiService = useApiService();
      this.isLoading = true;
      try {
        const feed = await apiService.getProductFeedBySlug(slug);
        this._cacheProducts(feed);
        return feed;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Fetches all products for a specific seller's public profile.
     * This does not use a timed cache; it lets `useLazyAsyncData` handle caching.
     */
    async getProductsByStoreSlug(slug: string): Promise<IProduct[]> {
      const apiService = useApiService();
      this.isLoading = true;
      try {
        const products = await apiService.getProductsByStoreSlug(slug);
        this._cacheProducts(products);
        return products;
      } catch (error) {
        console.error(`Failed to fetch products for store slug "${slug}":`, error);
        return [];
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Fetches all of a seller's products for their dashboard (includes drafts).
     */
    async fetchDashboardProducts(): Promise<IProduct[]> {
      const apiService = useApiService();
      this.isLoading = true;
      try {
        const products = await apiService.getDashboardProducts();
        this._cacheProducts(products);
        this.products = products; // Set the main product list to the dashboard list
        return products;
      } catch (error) {
        console.error('Failed to fetch dashboard products:', error);
        return [];
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Handler for real-time stock updates.
     */
    _handleRealtimeVariantUpdate(updatedVariant: IProductVariant) {
        if (!updatedVariant || !this.productMap.has(updatedVariant.productId)) return;

        const product = this.productMap.get(updatedVariant.productId)!;
        if (!product.variants) return;
        const variantIndex = product.variants.findIndex(v => v.id === updatedVariant.id);

        if (variantIndex !== -1) {
            product.variants[variantIndex] = updatedVariant;
            this.productMap.set(product.id!, { ...product });
        }
    },
  },
});

