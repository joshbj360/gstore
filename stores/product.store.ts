import { defineStore } from 'pinia';
import { useUserStore, useFeedStore } from '~/stores'; // Ensure useFeedStore is imported
import { useApiService } from '~/services/api/apiService';
import type { IProduct, ISellerProfile, IProductVariant, IMedia, IReel, IFeedItem } from '~/models';
import { notify } from '@kyvg/vue3-notification';
import { refreshNuxtData } from '#app'; // Import refreshNuxtData

export const useProductStore = defineStore('product', {
  state: () => ({
    products: [] as IProduct[], // For "Discover" page
    productMap: new Map<number, IProduct>(), // Global cache for FULL products
    discoverCurrentPage: 1,
    discoverHasMore: true,
    currentCategorySlug: 'all',
    isLoading: false,
    currentProductSlug: null as string | null,
  }),

  getters: {
    currentProduct(state): IProduct | null {
      if (!state.currentProductSlug) return null;
      return Array.from(state.productMap.values()).find(p => p.slug === state.currentProductSlug) || null;
    },
    currentSellerProfile(state): ISellerProfile | null | Partial<ISellerProfile>{
      const userStore = useUserStore();
      if (!this.currentProduct || !this.currentProduct.seller) return null;
      const storeSlug = this.currentProduct.seller.store_slug;
      if (typeof storeSlug === 'string' && storeSlug in userStore.sellerCache) {
        return userStore.sellerCache[storeSlug];
      }
      return this.currentProduct.seller;
    }
  },

  actions: {
    _cacheProducts(productsToCache: IProduct[]) {
      productsToCache.forEach(product => {
        if (product && product.id) {
          const existing = this.productMap.get(product.id) || {};
          this.productMap.set(product.id, { ...existing, ...product });
        }
      });
    },

    async fetchProductsForCategory(slug: string): Promise<IProduct[]> {
      this.isLoading = true;
      this.currentCategorySlug = slug;
      this.discoverCurrentPage = 1;
      try {
        const apiService = useApiService();
        // Updated to use the correct paginated endpoint
        const { products, meta } = await apiService.getProductsByCategorySlug(slug, { page: 1 });
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

    async fetchMoreProducts() {
        if (this.isLoading || !this.discoverHasMore) return;
        this.isLoading = true;
        try {
            const nextPage = this.discoverCurrentPage + 1;
            const apiService = useApiService();
            // Updated to use the correct paginated endpoint
            const { products, meta } = await apiService.getProductsByCategorySlug(this.currentCategorySlug, { page: nextPage });

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
     * This is the high-throughput create action.
     * It orchestrates the two-step (quick/heavy) API calls.
     */
    async createProduct(fullProductData: IProduct): Promise<IProduct | null> {
      const apiService = useApiService();
      const userStore = useUserStore();
      const feedStore = useFeedStore();
      this.isLoading = true;
      
      let newDraftProduct: IProduct | null = null;
      try {
          // --- STEP 1: The "Quick" Call (FIXED) ---
          // We now send all simple fields required by the create API's Zod schema
          newDraftProduct = await apiService.createProductDraft({ 
              title: fullProductData.title, 
              media: fullProductData.media ?? [],
              price: fullProductData.price,
              discount: fullProductData.discount,
              shippingZoneId: fullProductData.shippingZoneId,
              description: fullProductData.description,
              isAccessory: fullProductData.isAccessory
          });

          if (!newDraftProduct || !newDraftProduct.id) {
              throw new Error('Failed to create product draft.');
          }

          // --- Optimistic Update ---
          // const newFeedItem: IFeedItem = {
          //     id: `product-${newDraftProduct.id}`,
          //     type: 'PRODUCT',
          //     created_at: new Date(),
          //     author: {
          //         id: userStore.user!.id,
          //         username: userStore.sellerProfile?.store_name,
          //         avatar: userStore.sellerProfile?.store_logo,
          //         role: 'seller',
          //     },
          //     media: newDraftProduct.media?.[0],
          //     caption: newDraftProduct.title,
          //     likeCount: 0,
          //     taggedProducts: [newDraftProduct], // Tag itself
          //     product: newDraftProduct,
          // };
          // feedStore.mainFeed.unshift(newFeedItem); // Add to homepage feed
          this.products.unshift(newDraftProduct); // Add to dashboard list
          this.productMap.set(newDraftProduct.id, newDraftProduct); // Add to cache
          
          // --- STEP 2: The "Heavy" Call (Fire-and-Forget) ---
          // This call updates the product with variants, tags, category, etc.
          // It's "fire-and-forget" so the UI isn't blocked.
          apiService.updateProductDetails(newDraftProduct.id, fullProductData)
              .then(updatedProduct => {
                  console.log(`Product ${updatedProduct.id} details successfully published.`);
                  // Upgrade the cache with the full, published product data
                  this._cacheProducts([updatedProduct]);

                  // Update the item in the feedStore for full reactivity
                  const feedIndex = feedStore.mainFeed.findIndex(item => item.id === `product-${updatedProduct.id}`);
                  if (feedIndex !== -1) {
                    feedStore.mainFeed[feedIndex].product = updatedProduct;
                  }
                  
                  // --- THE "STALE DATA" FIX ---
                  // Proactively refresh all public feeds to show the new *published* product
                  refreshNuxtData('homepage-main');
                  refreshNuxtData('discover-products');
                  // We might also want to refresh the specific category feed
                  {
                    // Support multiple possible shapes for category in fullProductData:
                    // - fullProductData.category?.name
                    // - fullProductData.category being an array like [{ category: { name: string } }]
                    // - nested { category: { name } }
                    let categoryName: string | undefined;
                    const catField = (fullProductData as any).category;
                    if (Array.isArray(catField)) {
                      const first = catField[0];
                      categoryName = first?.name ?? first?.category?.name;
                    } else {
                      categoryName = catField?.name ?? catField?.category?.name;
                    }
                    if (categoryName) {
                      const categorySlug = categoryName.toLowerCase().replace(/\s+/g, '-');
                      refreshNuxtData(`category-${categorySlug}`);
                    }
                  }
              })
              .catch(err => {
                  console.error(`BACKGROUND_UPDATE_FAILED for product ${newDraftProduct?.id}:`, err);
                  // You would log this to a monitoring service (e.g., Sentry)
              });
          
          // Return the draft product *immediately* so the UI can redirect
          return newDraftProduct;

      } catch (error: any) {
          console.error('Error in createProduct (Store):', error);
          notify({ type: 'error', text: error.data?.message || 'Failed to create product.' });
          return null;
      } finally {
          this.isLoading = false;
      }
    },

    async updateProduct(productId: number, productData: IProduct): Promise<IProduct | null> {
      const apiService = useApiService();
      this.isLoading = true;
      try {
        // 1. Call your existing, robust API method
        const updatedProduct = await apiService.updateProductDetails(productId, productData);
        
        // 2. Update the global cache
        this._cacheProducts([updatedProduct]);

        // 3. Update the dashboard 'products' list
        const index = this.products.findIndex(p => p.id === productId);
        if (index !== -1) {
          this.products[index] = updatedProduct;
        }

        // 4. Refresh public feeds to show the changes
        refreshNuxtData('homepage-main');
        refreshNuxtData('discover-products');
        
        return updatedProduct;

      } catch (error: any) {
        notify({ type: 'error', text: error.data?.message || 'Failed to update product.' });
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Fetches a single product by its slug.
     * This is the "Smart Cache" logic.
     */
    async getProductBySlug(slug: string): Promise<IProduct | null> {
      // 1. Check if a product with this slug is already in the full cache
      const cachedProduct = Array.from(this.productMap.values()).find(p => p.slug === slug);
      
      // 2. We check for `description` as a "flag" to see if we have the full product data.
      if (cachedProduct && cachedProduct.description !== undefined) {
        console.log(`Serving product ${slug} from FULL cache.`);
        this.currentProductSlug = slug; // Set the current slug
        return cachedProduct;
      }

      // 3. If not in cache, or if cache is partial, fetch the full product from the API.
      const apiService = useApiService();
      this.isLoading = true;
      try {
        console.log(`Fetching FULL product ${slug} from API...`);
        const product = await apiService.getProductBySlug(slug);
        this._cacheProducts([product]); // This will "upgrade" the partial cache
        this.currentProductSlug = slug; // Set the current slug
        return product;
      } catch (error) {
        console.error(`Failed to fetch product by slug "${slug}":`, error);
        return null;
      } finally {
        this.isLoading = false;
      }
    },
    /**
     * Fetches a single product by its slug.
     * This is the "Smart Cache" logic.
     */
    async getProductById(id: number): Promise<IProduct | null> {
      // 1. Check if a product with this slug is already in the full cache
      const cachedProduct = Array.from(this.productMap.values()).find(p => p.id === id);
      
      // 2. We check for `description` as a "flag" to see if we have the full product data.
      if (cachedProduct && cachedProduct.description !== undefined) {
        console.log(`Serving product ${id} from FULL cache.`);
        //this.currentProductSlug = slug; // Set the current slug
        return cachedProduct;
      }

      // 3. If not in cache, or if cache is partial, fetch the full product from the API.
      const apiService = useApiService();
      this.isLoading = true;
      try {
        console.log(`Fetching FULL product ${id} from API...`);
        const product = await apiService.getProductById(id);
        this._cacheProducts([product]); // This will "upgrade" the partial cache
        //this.currentProductSlug = slug; // Set the current slug
        return product;
      } catch (error) {
        console.error(`Failed to fetch product by slug "${id}":`, error);
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchProductFeedForSlug(slug: string): Promise<IProduct[]> {
      const apiService = useApiService();
      this.isLoading = true;
      try {
        const feed = await apiService.getProductFeedBySlug(slug);
        this._cacheProducts(feed); // Cache all products
        return feed;
      } finally {
        this.isLoading = false;
      }
    },

    async getProductsByStoreSlug(slug: string): Promise<IProduct[]> {
      const apiService = useApiService();
      this.isLoading = true;
      try {
        const products = await apiService.getProductsByStoreSlug(slug);
        this._cacheProducts(products);
        return products;
      } catch (error) {
        return [];
      } finally {
        this.isLoading = false;
      }
    },

    async fetchDashboardProducts(): Promise<IProduct[]> {
      const apiService = useApiService();
      this.isLoading = true;
      try {
        const products = await apiService.getDashboardProducts();
        this._cacheProducts(products);
        this.products = products; // Set the `products` list to the dashboard list
        return products;
      } catch (error) {
        return [];
      } finally {
        this.isLoading = false;
      }
    },

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