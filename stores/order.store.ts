import { defineStore } from 'pinia';
import { useApiService } from '~/services/api/apiService';
import type { IOrders } from '~/models'; // Assuming IOrders is your main order interface
import { useUserStore } from './user.store';
import { notify } from '@kyvg/vue3-notification';

export const useOrderStore = defineStore('order', {
  state: () => ({
    // A cache for orders fetched for the seller dashboard
    sellerOrders: [] as IOrders[],
    // A cache for the logged-in buyer's order history
    buyerOrders: [] as IOrders[],
    // A map for quick O(1) lookups of any order by its ID
    orderMap: new Map<number, IOrders>(),
    isLoading: false,
  }),

  getters: {
    // Getter for the seller dashboard to display pending orders
    pendingSellerOrders: (state) => {
      // Now also includes PAID orders that are awaiting shipment
      return state.sellerOrders.filter(order => ['PENDING', 'PAID'].includes(order.status));
    },
    // Getter for a buyer to view their complete order history
    getBuyerOrderHistory: (state) => state.buyerOrders,
  },

  actions: {
    /**
     * A private helper to cache orders and prevent duplication.
     */
    _cacheOrders(ordersToCache: IOrders[], context: 'seller' | 'buyer' = 'seller') {
      ordersToCache.forEach(order => {
        this.orderMap.set(order.id, order);
      });
      
      // THE FIX: Correctly update either seller or buyer orders based on context.
      if (context === 'seller') {
        // This logic can be improved to merge instead of replace for pagination
        this.sellerOrders = ordersToCache;
      } else if (context === 'buyer') {
        this.buyerOrders = ordersToCache;
      }
    },

    /**
     * Fetches all orders that contain products belonging to the currently logged-in seller.
     * Designed to be called by useAsyncData in the Seller Dashboard.
     */
    async fetchSellerOrders() {
      const userStore = useUserStore();
      if (!userStore.isSeller) return [];

      this.isLoading = true;
      try {
        const apiService = useApiService();
        const orders = await apiService.getSellerOrders();
        // Pass the correct context to the caching function
        this._cacheOrders(orders, 'seller');
        return orders;
      } catch (error) {
        notify({ type: 'error', text: 'Could not load seller orders.' });
        return [];
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Fetches the order history for the currently logged-in buyer.
     */
    async fetchBuyerOrderHistory() {
        const userStore = useUserStore();
        if (!userStore.isLoggedIn) return [];

        this.isLoading = true;
        try {
            const apiService = useApiService();
            const orders = await apiService.getBuyerOrders(); 
            this._cacheOrders(orders, 'buyer');
            return orders;
        } catch (error) {
            notify({ type: 'error', text: 'Could not load your order history.' });
            return [];
        } finally {
            this.isLoading = false;
        }
    },

    /**
     * Allows a seller to mark an order as shipped, providing tracking info.
     */
    async markOrderAsShipped(orderId: number, trackingNumber: string, shipper: string) {
        this.isLoading = true;
        try {
            const apiService = useApiService();
            const updatedOrder = await apiService.markOrderAsShipped(orderId, trackingNumber, shipper);

            // Update the local cache with the new data
            const index = this.sellerOrders.findIndex(o => o.id === orderId);
            if (index !== -1) {
                this.sellerOrders[index] = updatedOrder;
            }
            this.orderMap.set(orderId, updatedOrder);

            notify({ type: 'success', text: `Order #${orderId} marked as shipped.` });
            return true;
        } catch (error: any) {
            notify({ type: 'error', text: error.data?.message || 'Failed to update order.' });
            return false;
        } finally {
            this.isLoading = false;
        }
    }
  },
});

