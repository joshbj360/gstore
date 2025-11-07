import { defineStore } from 'pinia';
import { useUserStore} from '~/stores';
import { useApiService } from '~/services/api/apiService';
import type { IProductVariant, ICartItem, IProduct } from '~/models';
import { notify } from '@kyvg/vue3-notification';

export const useCartStore = defineStore('cart', {
  state: () => ({
    cartItems: [] as ICartItem[],
    checkout: [] as ICartItem[],
    isLoading: false,
    hasSyncedWithDB: false, // Flag to track initial DB sync
  }),

  getters: {
    cartCount: (state) => state.cartItems.length,
    cartTotal: (state) => {
      return state.cartItems.reduce((total, item) => {
        const price = item.variant.price || item.product.price || 0;
        return total + (price * item.quantity);
      }, 0);
    },
  },

  actions: {
    /**
     * Resets the cart to its initial, empty state (called on logout).
     */
    reset() {
      this.$reset();
      this.hasSyncedWithDB = false;
    },

    /**
     * Fetches the cart from the DB for a logged-in user.
     */
    async fetchCartItems() {
      const userStore = useUserStore();
      if (!userStore.isLoggedIn || this.hasSyncedWithDB) return;

      this.isLoading = true;
      try {
        const apiService = useApiService();
        const dbItems = await apiService.getCartItems();
        
        // THE FIX: We now use the real DB ID.
        this.cartItems = dbItems.map((item: any) => ({
          ...item,
          product: item.variant.product, // Ensure product is nested correctly
        }));
        
        this.hasSyncedWithDB = true;
      } catch (error) {
        console.error("Failed to fetch cart from DB:", error);
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Merges a guest's local cart with the DB upon login.
     */
    async mergeAndSyncCartOnLogin() {
      const userStore = useUserStore();
      const apiService = useApiService();
      if (!userStore.isLoggedIn) return;
      this.isLoading = true;
      
      try {
        if (this.cartItems.length > 0) {
          // Send all local items to the backend to be merged
          for (const item of this.cartItems) {
            await apiService.addCartItem(item.variantId, item.quantity);
          }
        }
        // After merging, clear the local state and fetch the definitive cart from the DB
        this.cartItems = [];
        this.hasSyncedWithDB = false;
        await this.fetchCartItems();
      } catch (error) {
        console.error("Failed to merge guest cart:", error);
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Adds a specific product variant to the cart.
     */
    async addToCart(product: IProduct, variant: IProductVariant, quantity = 1) {
      const userStore = useUserStore();
      const apiService = useApiService();

      // Find the item in the cart *by its real variant ID*
      const existingItem = this.cartItems.find(item => item.variantId === variant.id);

      if (existingItem) {
        // If it exists, just update the quantity
        const newQuantity = existingItem.quantity + quantity;
        await this.updateItemQuantity(existingItem.id, newQuantity);
      } else {
        // If it's a new item, add it
        // 1. Optimistic UI Update (with a temporary ID)
        const tempId = `temp-${Date.now()}`;
        this.cartItems.push({
          id: tempId,
          variant,
          quantity,
          variantId: variant.id,
          userId: userStore.user?.id || '',
          created_at: new Date(),
          product,
        });

        // 2. Sync with DB if logged in
        if (userStore.isLoggedIn) {
          try {
            const savedItem = await apiService.addCartItem(variant.id, quantity);
            // 3. Reconcile: Replace the temporary item with the real one from the DB
            const index = this.cartItems.findIndex(item => item.id === tempId);
            if (index !== -1) {
              this.cartItems[index] = { ...savedItem, product: product };
            }
          } catch (error) {
            notify({ type: 'error', text: 'Could not add item to your cart.' });
            // Rollback optimistic update on failure
            this.cartItems = this.cartItems.filter(item => item.id !== tempId);
          }
        }
      }
    },

    /**
     * Updates the quantity of a specific item in the cart.
     */
    async updateItemQuantity(cartId: string, quantity: number) {
      const userStore = useUserStore();
      const apiService = useApiService();
      const index = this.cartItems.findIndex(item => item.id === cartId);

      if (index === -1) return;

      const originalQuantity = this.cartItems[index].quantity;
      const variantId = this.cartItems[index].variantId;
      
      // Optimistic update
      this.cartItems[index].quantity = quantity;

      if (userStore.isLoggedIn) {
        try {
          // THE FIX: Correctly call the API
          await apiService.updateCartItem(variantId, quantity);
        } catch (error) {
          // Rollback on failure
          this.cartItems[index].quantity = originalQuantity;
          notify({ type: 'error', text: 'Could not update item quantity.' });
        }
      }
    },

    /**
     * Removes an item from the cart using its *real* cartId.
     */
    async removeFromCart(cartId: string) {
      const userStore = useUserStore();
      const apiService = useApiService();
      const index = this.cartItems.findIndex(item => item.id === cartId);
      if (index === -1) return;

      const itemToRemove = this.cartItems[index];
      const variantId = itemToRemove.variantId;
      
      // Optimistic removal
      this.cartItems.splice(index, 1);

      if (userStore.isLoggedIn) {
        try {
          await apiService.removeCartItem(variantId);
        } catch (error) {
          // Rollback on failure
          this.cartItems.splice(index, 0, itemToRemove);
          notify({ type: 'error', text: 'Could not remove item from cart.' });
        }
      }
    },
    
    prepareForCheckout(selectedItems: ICartItem[]) {
      if (selectedItems.length === 0) return;
      this.checkout = [...selectedItems];
      useRouter().push('/shipping/checkout');
    },

    async clearPurchasedItems() {
      const userStore = useUserStore();
      const apiService = useApiService();
      const checkoutIds = new Set(this.checkout.map(item => item.id));
      const variantIdsToRemove = this.checkout.map(item => item.variantId);
      
      this.cartItems = this.cartItems.filter(item => !checkoutIds.has(item.id));
      this.checkout = [];

      // THE FIX: Call the API to remove items from the DB
      if (userStore.isLoggedIn) {
        try {
          await Promise.all(
            variantIdsToRemove.map(variantId => apiService.removeCartItem(variantId))
          );
        } catch (error) {
          console.error("Failed to clear purchased items from DB:", error);
        }
      }
    },
  },
  persist: true,
});