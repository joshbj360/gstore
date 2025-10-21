import { useRuntimeConfig } from '#app';
import type { IProduct, ICategory, IAddress, IShippingZone, IProfile, ISellerProfile, ICartItem, IOrders, IComment, IStory, IMedia, IReel } from '~/models';
import { ApiError } from './apiError';

//#region === API SERVICE INTERFACE ===.
// This prevents the "Excessive stack depth" error by being more direct.
interface ApiServiceOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Record<string, any> | BodyInit | null;
  params?: Record<string, any>;
  headers?: Record<string, string>;
}
//#endregion

/**
 * @name ApiService
 * @description
 * A central, singleton service for handling all API communications.
 */
class ApiService {
  private baseURL: string;

  constructor() {
    const config = useRuntimeConfig();
    this.baseURL = config.public.baseURL;
  }

  /**
   * The core request handler, now correctly typed using our simpler interface.
   */
  private async request<T>(endpoint: string, options: ApiServiceOptions = {}): Promise<T> {
    const headers: Record<string, string> = { ...options.headers };
    
    if (options.body && typeof options.body === 'object') {
        if (['POST', 'PATCH', 'PUT'].includes(options.method?.toUpperCase() || 'POST')) {
            headers['Content-Type'] = 'application/json';
        }
    }
    
    try {
      // The options object is now fully compatible with $fetch.
      return await $fetch<T>(`${this.baseURL}${endpoint}`, {
          ...options,
          headers,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      const message = error.data?.message || `An unexpected error occurred.`;
      
      console.error(`ApiService Error on ${endpoint}:`, error);
      throw new ApiError(message, statusCode);
    }
  }

  //#region === PRODUCT METHODS ===

  getAllProducts(params: { page?: number, limit?: number } = {}): Promise<IProduct[]> {
    return this.request('/api/prisma/products/get-all-products', { params });
  }
getProductById(id: number): Promise<IProduct> {
    return this.request(`/api/prisma/products/get-product-by-id/${id}`);
  }

  getProductBySlug(slug: string): Promise<IProduct> {
    return this.request(`/api/prisma/products/get-product-by-slug/${slug}`);
  }

  getProductsByCategorySlug(slug: string): Promise<{ category: ICategory, products: IProduct[] }> {
    return this.request(`/api/prisma/products/get-products-by-category-slug/${slug}`);
  }

  getSimilarProducts(productId: number): Promise<IProduct[]> {
    return this.request(`/api/prisma/products/get-similar-products-by-id/${productId}`);
  }

  getProductsByStoreSlug(slug: string): Promise<IProduct[]> {
    return this.request(`/api/prisma/products/get-products-by-store-slug/${slug}`);
  }
  
  getProductFeedBySlug(slug: string): Promise<IProduct[]> {
    return this.request(`/api/prisma/products/feed/${slug}`);
  }

  createProduct(productData: IProduct): Promise<IProduct> {
    return this.request('/api/prisma/products/create/create-product', {
      method: 'POST',
      body: productData,
    });
  }

  createBatchProducts(products: any): Promise<{ success: boolean; createdCount: number; errors: string[] }> {
    return this.request('/api/prisma/products/create/create-batch-products', {
      method: 'POST',
      body: products,
    });
  }
  //#endregion

  //#region === USER & SELLER METHODS ===

  getUserProfile(): Promise<IProfile> {
    return this.request('/api/prisma/user/profile');
  }

  getSellerProfileBySlug(slug: string): Promise<ISellerProfile> {
    return this.request(`/api/prisma/user/seller/get-seller-store-by-slug/${slug}`);
  }

  createSellerProfile(data: Partial<ISellerProfile>): Promise<ISellerProfile> {
    return this.request('/api/prisma/user/seller-profile', {
      method: 'POST',
      body: data
    });
  }
  //#endregion

  //#region === CATEGORY METHODS ===
  getAllCategories(): Promise<ICategory[]> {
    return this.request('/api/prisma/categories/get-all-categories');
  }
  createCategory(categoryData: { name: string; thumbnailCatUrl: string }): Promise<ICategory> {
    return  this.request('/api/prisma/categories/create-category', {
          method: 'POST',
          body: categoryData,
        });
  }
  //#endregion
  
  //#region === CART METHODS ===

  getCartItems(): Promise<ICartItem[]> {
    return this.request('/api/prisma/cart');
  }

  addCartItem(item: { variantId: number, quantity: number }): Promise<ICartItem> {
    return this.request('/api/prisma/cart/add', {
      method: 'POST',
      body: item,
    });
  }

  updateCartItem(variantId: number, quantity: number): Promise<ICartItem> {
    return this.request('/api/prisma/cart/update', {
      method: 'PATCH',
      body: { variantId, quantity },
    });
  }

  removeCartItem(variantId: number): Promise<{ success: boolean }> {
    return this.request('/api/prisma/cart/remove', {
      method: 'DELETE',
      body: { variantId },
    });
  }
  //#endregion

  //#region === ORDER & PAYMENT METHODS ===

  initializePayment(amount: {amount: number}): Promise<{ authorization_url: string; reference: string; }> {
    return this.request('/api/prisma/orders/initialize-payment', {
      method: 'POST',
      body: amount ,
    });
  }


  createOrder(payload: any): Promise<any> {
    return this.request('/api/prisma/orders/create-order', {
      method: 'POST',
      body: payload,
    });
  }

  getSellerOrders(): Promise<IOrders[]> {
    return this.request(`/api/prisma/orders/seller`);
  }
  getBuyerOrders(): Promise<IOrders[]> {
    return this.request('/api/prisma/orders/buyer');
  }

  markOrderAsShipped(orderId: number, trackingNumber: string, shipper: string): Promise<IOrders> {
    return this.request('/api/prisma/orders/ship', {
      method: 'PATCH',
      body: { orderId, trackingNumber, shipper },
    });
  }
  //#endregion

  //#region === WALLET & PAYOUT METHODS ===

  getSellerWallet(): Promise<any> {
    return this.request('/api/prisma/wallet');
  }

  requestPayout(payoutDetails: { amount: number; bankDetails: any }): Promise<{ success: boolean; message: string; }> {
    return this.request('/api/prisma/payouts/request', {
      method: 'POST',
      body: payoutDetails,
    });
  }
  //#endregion

  //#region === SHIPPING ADDRESS METHODS ===

  getAddress(): Promise<IAddress | null> {
    return this.request('/api/prisma/address');
  }

  saveAddress(addressData: Partial<IAddress>): Promise<IAddress> {
    return this.request('/api/prisma/address', {
      method: 'POST',
      body: addressData
    });
  }
  //#endregion

  //#region === SHIPPING ZONE METHODS ===

  getShippingZones(): Promise<IShippingZone[]> {
    return this.request('/api/prisma/shipping/zones');
  }

  createShippingZone(zoneData: Partial<IShippingZone>): Promise<IShippingZone> {
    return this.request('/api/prisma/shipping/zones', {
      method: 'POST',
      body: zoneData
    });
  }
  
  updateShippingZone(zoneData: Partial<IShippingZone>): Promise<IShippingZone> {
      return this.request('/api/prisma/shipping/zones', {
          method: 'PATCH',
          body: zoneData
      });
  }

  deleteShippingZone(zoneId: string): Promise<{ success: boolean }> {
      return this.request('/api/prisma/shipping/zones', {
        method: 'DELETE',
        body: { id: zoneId }
      });
  }
  //#endregion

  //#region === COMMENT METHODS ===

  getProductComments(id: number): Promise<IComment[]> {
    return this.request(`/api/prisma/comments/get-by-product-id/${id}`);
  }

  createComment(payload: { productId: number; text: string; parentId?: string | null }): Promise<IComment> {
    return this.request('/api/prisma/comments/create-comment', {
      method: 'POST',
      body: payload,
    });
  }

  toggleCommentLike(commentId: string): Promise<{ liked: boolean }> {
    return this.request('/api/prisma/like/like-unlike-comment', {
      method: 'POST',
      body: { commentId },
    });
  }


  //#endregion

  //#region === LIKE METHODS ===
  getUserLikes(): Promise<{ productLikes: number[]; commentLikes: string[] }> {
    return this.request('/api/prisma/like/user-likes');
  }

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Toggles the like status for a product.
 * @param {number} productId The ID of the product to toggle the like status for.
 * @returns {Promise<{ liked: boolean }>} A promise that resolves with an object containing the like status.
 * @example
 * const response = await apiService.toggleProductLike(123);
 * const { liked } = response;
 * console.log(liked ? 'Product is liked' : 'Product is not liked');
 */
/*******  aba371f3-3129-4c89-93e7-0cb7d4ec6846  *******/  toggleProductLike(productId: number): Promise<{ liked: boolean }> {
    return this.request('/api/prisma/like/like-unlike-product', {
      method: 'POST',
      body: { productId },
    });
  }

  //#endregion

  //#region === HOMEPAGE METHODS ===
  getHomepageData(): Promise<{
      stories: IStory[]; 
      featuredProducts: IProduct[]; 
      products: IProduct[]; 
      topSellers: ISellerProfile[]; 
      hotAccessories: IProduct[];
  }> {
    return this.request('/api/prisma/home/home-page-api');
  }
  //#endregion

  //#region === UPLOAD METHODS ===
  getCloudinarySignature(): Promise<{ signature: string; timestamp: number }> {
    return this.request('/api/prisma/media/cloudinary-signature');
  }
  //#endregion

  //#region === SEARCH METHODS ===
  searchProducts(query: string): Promise<IProduct[]> {
    return this.request(`/api/prisma/search/search-by-name/${query}`, {
      method: 'POST',
      body: { query },
    });
  }

  //#region === STORY & REEL METHODS ===
   /**
   * Fetches a paginated, unified feed of Reels (Stories and Video Products).
   * @param params - Pagination options { page, limit }.
   */
  getReels(params: { page: number, limit?: number }): Promise<{ reels: IReel[], meta: { hasMore: boolean } }> {
    return this.request('/api/prisma/reels', { params });
  }
  createStory(payload: { media: object; productId?: number | null }): Promise<IStory> {
    return this.request('/api/prisma/stories/create-story', {
      method: 'POST',
      body: payload,
    });
  }

  fetchStory(storyId: string): Promise<IStory[]> {
    return this.request(`/api/prisma/stories/feed/${storyId}`);
  }
  //#endregion

  //#region === AI METHODS ===

  async aiChat(params: { productId?: number; message: string; context?: IProduct[] }): Promise<string> {
    try {
      const { productId, message, context } = params;
      const response = await $fetch<{ reply: string }>('/api/ai/chat', {
        method: 'POST',
        body: { productId, message, context: JSON.stringify(context || []) },
      });
      return response.reply;
    } catch (error) {
      console.error('AI Chat Error:', error);
      return 'Style tip: Add some accessories for that extra edge! What\'s your vibe?';
    }
  }

  //#endregion

}

let apiServiceInstance: ApiService | null = null;
export const useApiService = () => {
    if (!apiServiceInstance) {
        apiServiceInstance = new ApiService();
    }
    return apiServiceInstance;
};

