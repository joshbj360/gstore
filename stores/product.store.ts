import { defineStore } from "pinia";
import type { ProductInterface } from "~/models/interface/products/product.interface";

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DEFAULT_PAGE_LIMIT = 20;

export const useProductStore = defineStore('product', {
  state: () => ({
    products: [] as ProductInterface[],
    productMap: new Map<number, ProductInterface>(),
    categoryCache: new Map<string, ProductInterface[]>(),
    similarProductCache: new Map<number, ProductInterface[]>(), // Cache for similar products by productId
    sellerProductCache: new Map<string, ProductInterface[]>(), // Cache for products by sellerId
    lastFetched: new Map<string | number, number>(),
    currentCategory: null as string | null,
    currentProduct: null as ProductInterface | null,
    isLoading: false,
    DEFAULT_PAGE_LIMIT: 20,
    hasMoreProducts: false
  }),

  getters: {
    getProductsByCategory: (state) => (category?: string | null) => {
      if (!category) return state.products;
      return state.categoryCache.get(category) || [];
    },
    getSimilarProducts: (state) => (productId: number) => {
      // Check cache first
      const cachedSimilarProducts = state.similarProductCache.get(productId);
      if (cachedSimilarProducts && Date.now() - (state.lastFetched.get(productId) || 0) <= CACHE_DURATION) {
        return cachedSimilarProducts.slice(0, 4); // Limit to 4 as per previous requirement
      }

      // Fetch from API if not in cache or cache is expired
      const fetchSimilarProducts = async () => {
        try {
          const { data } = await useFetch<ProductInterface[]>(`/api/prisma/products/get-similar-products-by-id/${productId}`);
          if (data.value) {
            const similarProducts = data.value as ProductInterface[];
            state.similarProductCache.set(productId, similarProducts);
            state.lastFetched.set(productId, Date.now());
            return similarProducts.slice(0, 4); // Limit to 4
          }
          return [];
        } catch (err) {
          console.error('Failed to fetch similar products:', err);
          return [];
        }
      };

      // Return promise-based result synchronously
      return fetchSimilarProducts();
    },
  },

  actions: {
    async initialize() {
      if (this.products.length === 0) {
        await this.fetchProducts();
      }
    },

    getProductById(id: number) {
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
        const { data } = await useFetch<ProductInterface>(`/api/prisma/products/get-product-by-id/${id}`);
        if (data.value) {
          this.cacheProducts([data.value]);
          this.currentProduct = data.value;
          return data.value;
        }
        return undefined;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchProducts(page: number = 1, limit: number = DEFAULT_PAGE_LIMIT) {
      this.isLoading = true;
      try {
        const { data, error } = await useFetch<ProductInterface[]>('/api/prisma/products/get-all-products', {
          params: { page, limit },
        });
        if (error.value) throw error.value;
        if (data.value) {
          this.cacheProducts(data.value);
          return data.value;
        }
        return [];
      } finally {
        this.isLoading = false;
      }
    },

    async fetchMoreProducts(limit: number = DEFAULT_PAGE_LIMIT) {
      this.isLoading = true;
      try {
        const nextPage = Math.floor(this.products.length / limit) + 1;
        if (this.currentCategory) {
          const { data, error } = await useFetch<ProductInterface[]>(
            `/api/prisma/products/get-products-by-category-name/${encodeURIComponent(this.currentCategory)}`,
            { params: { page: nextPage, limit } }
          );
          if (error.value) throw error.value;
          if (data.value) this.cacheProducts(data.value, this.currentCategory);
        } else {
          const { data, error } = await useFetch<ProductInterface[]>('/api/prisma/products/get-all-products', {
            params: { page: nextPage, limit },
          });
          if (error.value) throw error.value;
          if (data.value) this.cacheProducts(data.value);
        }
      } catch (err) {
        console.error('fetchMoreProducts error:', err);
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async filterByCategory(categoryName: string | null) {
      this.currentCategory = categoryName;
      if (categoryName && !this.categoryCache.has(categoryName)) {
        this.isLoading = true;
        try {
          const { data } = await useFetch<ProductInterface[]>(
            `/api/prisma/products/get-products-by-category-name/${encodeURIComponent(categoryName)}`,
            { params: { page: 1, limit: this.DEFAULT_PAGE_LIMIT } }
          );
          if (data.value) this.cacheProducts(data.value, categoryName);
        } finally {
          this.isLoading = false;
        }
      }
    },

    async getProductsByStoreName(store_name: string) {
      
      // Check cache first
      const cachedProducts = this.sellerProductCache.get(store_name);
      if (cachedProducts && Date.now() - (this.lastFetched.get(store_name) || 0) <= CACHE_DURATION) {
        return cachedProducts;
      }

      this.isLoading = true;
      try {
        const { data } = await useFetch<ProductInterface[]>(`/api/prisma/products/get-products-by-storename/${store_name}`);
        if (data.value) {
          const products = data.value as ProductInterface[];
          this.sellerProductCache.set(store_name, products);
          this.lastFetched.set(store_name, Date.now());
          // Update productMap and products array
          products.forEach(product => {
            if (product.id) {
              if (!this.productMap.has(product.id)) {
              this.productMap.set(product.id, product);
              this.products.push(product);
            }
            }
            
          });
          console.log('this are products by seller ', products, 'source: [store/product.store.getProductByStoreName}')
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
        const { data, error } = await useFetch<ProductInterface>('/api/prisma/products/create-product', {
          method: 'POST',
          body: completeProduct,
        });

        if (error.value) throw new Error(error.value.message || 'Failed to create product');

        if (data.value) {
          // Optionally cache the new product
          this.cacheProducts([data.value]);
          return data.value;
        }
        return null;
      } catch (err) {
        console.error('Create product error:', err);
        throw err; // Re-throw for caller to handle, or return a custom error object
      } finally {
        this.isLoading = false;
      }
    },

    cacheProducts(products: ProductInterface[], category?: string) {
      const validProducts = products.filter(p =>
        p && typeof p.id === 'number' && p.title && Array.isArray(p.media)
      );

      const newProducts: ProductInterface[] = [];
      validProducts.forEach((product) => {
        if (!this.productMap.has(Number(product.id))) {
          newProducts.push(product);
        }
        this.productMap.set(Number(product.id), product);
        this.lastFetched.set(Number(product.id), Date.now());
      });

      this.products = [
        ...newProducts,
        ...this.products.filter((p) => !newProducts.some((np) => np.id === p.id)),
      ];

      if (category) {
        const existing = this.categoryCache.get(category) || [];
        this.categoryCache.set(category, [
          ...newProducts,
          ...existing.filter((p) => !newProducts.some((np) => np.id === p.id)),
        ]);
        this.lastFetched.set(category, Date.now());
      }
    },
    
  },
});