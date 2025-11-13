import { useRuntimeConfig } from '#app';
import type { IProduct, ICategory, IAddress, IWallet, IFeedItem, IShippingZone, IProfile, ISellerProfile, ICartItem, IOrders, IStory, IComment, INotification, IReel, IMedia, IPost } from '~/models';
import { ApiError } from './apiError';
// THE FIX: We must import H3Event and getHeader from 'h3'
import { H3Event, getHeader } from 'h3';
// useRequestEvent is correctly auto-imported from '#imports'
import { useRequestEvent } from '#imports';

interface ApiServiceOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Record<string, any> | BodyInit | null;
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

class ApiService {
  private baseURL: string;

  constructor() {
    const config = useRuntimeConfig();
    this.baseURL = config.public.baseURL || '';
  }

  private async request<T>(endpoint: string, options: ApiServiceOptions = {}): Promise<T> {
    const headers: Record<string, string> = { ...options.headers };
    
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
        if (['POST', 'PATCH', 'PUT'].includes(options.method?.toUpperCase() || 'POST')) {
            headers['Content-Type'] = 'application/json';
        }
    }

    // --- THE FIX: AUTH FORWARDING ---
    // This solves all "server-to-self" 500 Auth errors
    if (process.server) {
      const event: H3Event | undefined = useRequestEvent();
      if (event) {
        // Get the cookie from the original user request
        const cookie = getHeader(event, 'cookie');
        if (cookie) {
          // Add that cookie to the internal API request
          headers['cookie'] = cookie;
        }
      }
    }
    // --- END OF FIX ---
    
    try {
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

  // === HOMEPAGE & FEEDS ===
  
getHomeFeed(params: { limit?: number, cursor?: string | null }): Promise<{ feed: IFeedItem[], meta: { hasMore: boolean, nextCursor: string | null } }> {
    // We filter out undefined/null params before sending
    const cleanParams: Record<string, any> = {};
    if (params.limit) cleanParams.limit = params.limit;
    if (params.cursor) cleanParams.cursor = params.cursor;
    
    return this.request('/api/prisma/home/feed', { params: cleanParams });
  }
  
  getHomeStories(): Promise<IStory[]> {
    return this.request('/api/prisma/stories/feed');
  }
  
  getHotAccessories(): Promise<IProduct[]> {
    return this.request('/api/prisma/products/accessories');
  }

  getReels(params: { page: number, limit?: number }): Promise<{ reels: IReel[], meta: { hasMore: boolean } }> {
    return this.request('/api/prisma/reels', { params });
  }

  // === PRODUCT METHODS ===
  
  createProductDraft(data: Partial<IProduct>): Promise<IProduct> {
    return this.request('/api/prisma/products/dashboard/create', {
      method: 'POST',
      body: data,
    });
  }

  updateProductDetails(productId: number, payload: IProduct): Promise<IProduct> {
    return this.request(`/api/prisma/products/dashboard/update/${productId}`, {
      method: 'PATCH',
      body: payload,
    });
  }
  
  quickCreateProduct(data: { title: string, price: number, categoryName: string, media: IMedia[], description: string }): Promise<IProduct> {
    return this.request('/api/prisma/products/quick-create', {
        method: 'POST',
        body: data,
    });
  }
  
  getProductsByCategorySlug(slug: string, params: { page?: number, limit?: number } = {}): Promise<{ products: IProduct[], meta: any }> {
    return this.request(`/api/prisma/products/get-products-by-category-slug/${slug}`, { params });
  }

  searchProducts(query: string): Promise<IProduct[]> {
    return this.request(`/api/prisma/search/search-by-name/${query}`);
  }
  
  searchAllProducts(query: string): Promise<IProduct[]> {
    return this.request(`/api/prisma/search/search-all-products/${query}`);
  }

  getProductBySlug(slug: string): Promise<IProduct> {
    return this.request(`/api/prisma/products/get-product-by-slug/${slug}`);
  }
  
  getProductById(id: number): Promise<IProduct> {
    return this.request(`/api/prisma/products/get-product-by-id/${id}`);
  }
  
  getProductFeedBySlug(slug: string): Promise<IProduct[]> {
    return this.request(`/api/prisma/products/feed/${slug}`);
  }

  getProductsByStoreSlug(slug: string): Promise<IProduct[]> {
    return this.request(`/api/prisma/products/get-products-by-store-slug/${slug}`);
  }
  
  getDashboardProducts(): Promise<IProduct[]> {
    return this.request('/api/prisma/products/dashboard');
  }

  getLinkedAccessories(productId: number): Promise<IProduct[]> {
    return this.request(`/api/prisma/products/accessories/linked-products/${productId}`);
  }
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
  

  // === USER & SELLER METHODS ===
  
  getUserProfile(): Promise<IProfile> {
    return this.request('/api/prisma/user/profile');
  }
  
  getTopSellers(): Promise<ISellerProfile[]> {
      return this.request('/api/prisma/home/top-sellers');
  }

  getSellerProfileBySlug(slug: string): Promise<ISellerProfile> {
    return this.request(`/api/prisma/user/sellers/get-seller-store-by-slug/${slug}`);
  }
  
  createSellerProfile(data: Partial<ISellerProfile>): Promise<ISellerProfile> {
    return this.request('/api/prisma/user/sellers/seller-profile', {
      method: 'POST',
      body: data
    });
  }
/**
   * THE FIX: This method now sends cursor-based parameters
   * instead of page-based parameters, matching the API.
   */
  getAllSellers(params: { 
    limit?: number, 
    cursorId?: string, 
    cursorFollowers?: number 
  }): Promise<{ sellers: ISellerProfile[], meta: any }> {
    return this.request('/api/prisma/user/seller/all', { params });
  }

  getUserFollows(): Promise<any[]> {
    return this.request('/api/prisma/follow/my-followers');
  }

  toggleFollow(sellerProfileId: string): Promise<{ following: boolean }> {
    return this.request('/api/prisma/follow', {
      method: 'POST',
      body: { sellerProfileId }
    });
  }

  // === CART, ORDER, PAYMENT, ETC. ===
  
  getCartItems(): Promise<ICartItem[]> {
    return this.request('/api/prisma/cart');
  }

  private cartAction(action: 'add' | 'update' | 'remove', variantId: number, quantity?: number): Promise<ICartItem> {
    return this.request('/api/prisma/cart', {
        method: 'POST',
        body: { action, variantId, quantity }
    });
  }

  addCartItem(variantId: number, quantity: number): Promise<ICartItem> {
    return this.cartAction('add', variantId, quantity);
  }

  updateCartItem(variantId: number, quantity: number): Promise<ICartItem> {
    return this.cartAction('update', variantId, quantity);
  }

  removeCartItem(variantId: number): Promise<ICartItem> {
    return this.cartAction('remove', variantId);
  }
  
  getSellerOrders(): Promise<IOrders[]> {
    return this.request('/api/prisma/orders/seller');
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
  
  initializePayment(amount: number): Promise<{ authorization_url: string; reference: string; }> {
    return this.request('/api/prisma/orders/initialize-payment', {
      method: 'POST',
      body: { amount },
    });
  }
  
  createOrder(payload: any): Promise<any> {
    return this.request('/api/prisma/orders/create-order', {
      method: 'POST',
      body: payload,
    });
  }

  // === WALLET & PAYOUT METHODS ===
  
  getSellerWallet(): Promise<IWallet> {
    return this.request('/api/prisma/wallet');
  }

  requestPayout(payoutDetails: { amount: number; bankDetails: any }): Promise<{ success: boolean; message: string; }> {
    return this.request('/api/prisma/payouts/request', {
      method: 'POST',
      body: payoutDetails,
    });
  }

  // === SHIPPING ADDRESS METHODS ===
  
  getAddress(): Promise<IAddress | null> {
    return this.request('/api/prisma/address');
  }

  saveAddress(addressData: Partial<IAddress>): Promise<IAddress> {
    return this.request('/api/prisma/address', {
      method: 'POST',
      body: addressData
    });
  }

  // === SHIPPING ZONE METHODS ===
  
  getShippingZones(): Promise<IShippingZone[]> {
    return this.request('/api/prisma/shipping');
  }

  createShippingZone(zoneData: Partial<IShippingZone>): Promise<IShippingZone> {
    return this.request('/api/prisma/shipping', {
      method: 'POST',
      body: zoneData
    });
  }
  
  updateShippingZone(zoneData: Partial<IShippingZone>): Promise<IShippingZone> {
      return this.request('/api/prisma/shipping', {
          method: 'PATCH',
          body: zoneData
      });
  }

  deleteShippingZone(zoneId: string): Promise<{ success: boolean }> {
      return this.request('/api/prisma/shipping', {
        method: 'DELETE',
        body: { id: zoneId }
      });
  }

  // === SOCIAL & ENGAGEMENT (LIKES, COMMENTS, STORIES) ===
  
  getUserLikes(): Promise<{ productLikes: any[], commentLikes: any[], postLikes: any[] }> {
    return this.request('/api/prisma/like');
  }

  toggleProductLike(productId: number): Promise<{ liked: boolean }> {
      return this.request('/api/prisma/like/like-unlike-product', {
          method: 'POST',
          body: { productId }
      });
  }
  
  togglePostLike(postId: string): Promise<{ liked: boolean }> {
    return this.request('/api/prisma/like/like-unlike-post', {
        method: 'POST',
        body: { postId }
    });
  }

  toggleCommentLike(commentId: string): Promise<{ liked: boolean }> {
    return this.request('/api/prisma/like/like-unlike-comment', {
      method: 'POST',
      body: { commentId },
    });
  }

  createStory(storyData: { media: object; productId?: number | null }): Promise<IStory> {
    return this.request('/api/prisma/stories/create-story', {
      method: 'POST',
      body: storyData,
    });
  }
  
  getStoryFeed(storyId: string): Promise<IStory[]> {
    return this.request(`/api/prisma/stories/feed/${storyId}`);
  }

  createPost(postData: {media: IMedia, caption:string, taggedProductIds:number[]}): Promise<IPost> {
    return this.request('/api/prisma/posts/create', {
      method: 'POST',
      body: postData
    })
  }

  getProductComments(id: number): Promise<IComment[]> {
    return this.request(`/api/prisma/comments/get-by-product-id/${id}`);
  }

  getPostComments(id: string): Promise<IComment[]> {
    return this.request(`/api/prisma/comments/get-by-post-id/${id}`);
  }
 createComment(payload: { text: string; parentId?: string | null; productId?: number | null; postId?: string | null }): Promise<IComment> {
    return this.request('/api/prisma/comments/create-comment', {
      method: 'POST',
      body: payload,
    });
  }
  
  // === NOTIFICATIONS ===
  getNotifications(): Promise<{ notifications: INotification[], unreadCount: number }> {
      return this.request('/api/prisma/notifications');
  }
  
  // === MISC ===
  getCloudinarySignature(): Promise<{ signature: string, timestamp: number }> {
      return this.request('/api/prisma/media/cloudinary-signature');
  }

  searchSellerProducts(query: string): Promise<IProduct[]> {
      return this.request(`/api/prisma/search/seller-products`, { params: { query } });
  }

  //#region === AI METHODS (MERGED & SECURED) ===
  
  // From your new `useApi.ts`, but points to *our* secure server route
  aiGenerateDescription(productInfo: any): Promise<{ description: string }> {
    return this.request('/api/ai/generate-description', {
      method: 'POST',
      body: productInfo
    });
  }

  // From your new `useApi.ts`, but points to *our* secure server route
  aiSuggestHashtags(title: string, category: string): Promise<{ hashtags: string[] }> {
    return this.request('/api/ai/suggest-hashtags', {
      method: 'POST',
      body: { title, category }
    });
  }

  // From your new `useApi.ts`, but points to *our* secure server route
  aiGeneratePlatformCaption(platformId: string, productInfo: any): Promise<{ caption: string }> {
    return this.request('/api/ai/generate-caption', {
      method: 'POST',
      body: { platformId, ...productInfo }
    });
  }
  //#endregion

    // --- NEW SOCIAL METHODS (Merged) ---
  //
  // These are the methods your new UI calls.
  // You will still need to build these server API routes.

  /**
   * Kicks off the OAuth flow (if not using Supabase linking).
   */
  connectSocialPlatform(platform: string): Promise<any> {
    return this.request('/api/social/connect', {
      method: 'POST',
      body: { platform }
    });
  }

  /**
   * Sends the final post to your server, which then uses the Supabase provider_token.
   */
  postToSocial(socialData: any): Promise<any> {
    return this.request('/api/social/post', {
      method: 'POST',
      body: socialData
    });
  }
}



// Singleton instance of the ApiService
let apiServiceInstance: ApiService | null = null;
export const useApiService = () => {
    if (!apiServiceInstance) {
        apiServiceInstance = new ApiService();
    }
    return apiServiceInstance;
};