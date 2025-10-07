import { useRuntimeConfig } from '#app';
import type { IProduct, ICategory, IAddress, IShippingZone, IProfile, ISellerProfile, ICartItem, IOrders, IComment } from '~/models';
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
    return this.request(`/api/prisma/products/get-product-feed-by-slug/${slug}`);
  }

  createProduct(productData: IProduct): Promise<IProduct> {
    return this.request('/api/prisma/products/create-product', {
      method: 'POST',
      body: productData,
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

  /**
   * NEW METHOD: Encapsulates the EventSource connection logic.
   * @param productId The ID of the product to listen for comments on.
   * @param onUpdate A callback function that the store will provide to handle new messages.
   * @returns The EventSource instance so it can be managed (closed) by the store.
   */
  subscribeToCommentUpdates(id: number, onUpdate: (data: any) => void): EventSource {
     const url = new URL(`${this.baseURL}/api/prisma/comments/subscribe-by-product-id/${id}`);
    const eventSource = new EventSource(url.toString());
    
    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'UPDATE') {
                // When a message is received, call the provided callback function.
                onUpdate(data.payload);
            }
        } catch (e) {
            console.error("Failed to parse SSE message:", e);
        }
    };
    
    return eventSource;
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

