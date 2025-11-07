import { defineStore } from 'pinia';
import { useUserStore } from '~/stores';
import { useApiService } from '~/services/api/apiService';
import type { IProduct, ISellerProfile, IProductVariant } from '~/models';
import { notify } from '@kyvg/vue3-notification';

export const useProductStore = defineStore('product', {
  state: () => ({
    // This list is now for the "Discover" / "Category" pages
    products: [] as IProduct[],
    
    // This cache ONLY stores FULL product objects
    productMap: new Map<number, IProduct>(),
    
    discoverCurrentPage: 1,
    discoverHasMore: true,
    currentCategorySlug: 'all',
    isLoading: false,
    
    currentProductSlug: null as string | null,
  }),

  getters: {
    currentProduct(state): IProduct | null {
      if (!state.currentProductSlug) return null;
      // The store now only has one place to look: the definitive cache
      return Array.from(state.productMap.values()).find(p => p.slug === state.currentProductSlug) || null;
    },
    currentSellerProfile(state): ISellerProfile | null {
      const userStore = useUserStore();
      if (!this.currentProduct || !this.currentProduct.seller) return null;
      return userStore.sellerCache[this.currentProduct.seller.store_slug] || this.currentProduct.seller;
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

    // --- Feed logic has been removed ---

    async fetchProductsForCategory(slug: string): Promise<IProduct[]> {
      this.isLoading = true;
      this.currentCategorySlug = slug;
      this.discoverCurrentPage = 1;
      try {
          const apiService = useApiService();
          const { products, meta } = await apiService.getProductsByCategorySlug_Paginated(slug, { page: 1 });
          this.products = products;
          this._cacheProducts(products); // Cache the full products
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
    
    async createProduct(fullProductData: IProduct): Promise<IProduct | null> {
      // ... (This logic remains the same, but we must update the `apiService` calls)
      const apiService = useApiService();
      this.isLoading = true;
      let newDraftProduct: IProduct | null = null;
      try {
          newDraftProduct = await apiService.createProductDraft({ 
              title: fullProductData.title, 
              media: fullProductData.media 
          });
          if (!newDraftProduct || !newDraftProduct.id) {
              throw new Error('Failed to create product draft.');
          }

          // Optimistic update: Add to the 'Discover' feed
          this.products.unshift(newDraftProduct);
          this.productMap.set(newDraftProduct.id, newDraftProduct);
          
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
     * THE FIX: The logic is now simple and robust.
     * It checks the `productMap` for a *full* product.
     */
    async getProductBySlug(slug: string): Promise<IProduct | null> {
      // 1. Check if a product with this slug is already in the full cache
      const cachedProduct = Array.from(this.productMap.values()).find(p => p.slug === slug);
      
      // 2. We still check for `description` as the "flag" for a full product
      if (cachedProduct && cachedProduct.description !== undefined) {
        console.log(`Serving product ${slug} from FULL cache.`);
        return cachedProduct;
      }

      // 3. If not in cache, or if cache is partial, fetch the full product from the API.
      const apiService = useApiService();
      this.isLoading = true;
      try {
        console.log(`Fetching FULL product ${slug} from API...`);
        const product = await apiService.getProductBySlug(slug);
        this._cacheProducts([product]); // This will "upgrade" the partial cache
        return product;
      } catch (error) {
        console.error(`Failed to fetch product by slug "${slug}":`, error);
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
        this.products = products;
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

