import { defineStore } from 'pinia';
import { useUserStore } from '~/stores';
import { useApiService } from '~/services/api/apiService';
import type { IProductVariant, ICartItem, IProduct } from '~/models';
import { notify } from '@kyvg/vue3-notification';
import { useRouter } from 'vue-router'; // Import useRouter

export const useCartStore = defineStore('cart', {
  state: () => ({
    /**
     * The cartItems are now stored in a Map.
     * The key is the `variantId` (number).
     * This makes lookups, updates, and deletes an O(1) operation
     * and eliminates all race conditions with temporary IDs.
     */
    cartItems: new Map<number, ICartItem>(),
    checkout: [] as ICartItem[],
    isLoading: false,
    hasSyncedWithDB: false, // Flag to track initial DB sync
  }),

  getters: {
    /**
     * Returns the total number of unique items in the cart.
     */
    cartCount: (state) => state.cartItems.size,

    /**
     * Returns the cart items as an array, which is useful for v-for loops.
     */
    cartItemsArray: (state) => Array.from(state.cartItems.values()),

    /**
     * Calculates the total price of all items in the cart.
     */
    cartTotal: (state) => {
      // Iterate over the map's values to calculate the total
      return Array.from(state.cartItems.values()).reduce((total, item) => {
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
      this.cartItems.clear(); // Explicitly clear the Map
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

        // Clear the map and re-populate it using variantId as the key
        this.cartItems.clear();
        dbItems.forEach((item: any) => {
          const formattedItem = {
            ...item,
            product: item.variant.product, // Ensure product is nested correctly
          };
          this.cartItems.set(formattedItem.variantId, formattedItem);
        });

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
        // Check the size of the Map
        if (this.cartItems.size > 0) {
          // Send all local items to the backend to be merged
          // Iterate over the Map's values
          for (const item of this.cartItems.values()) {
            await apiService.addCartItem(item.variantId, item.quantity);
          }
        }
        // After merging, clear the local state and fetch the definitive cart from the DB
        this.cartItems.clear();
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

      // Find the item in the cart *by its variant ID*
      const existingItem = this.cartItems.get(variant.id);

      if (existingItem) {
        // If it exists, just update the quantity
        const newQuantity = existingItem.quantity + quantity;
        // We now call updateItemQuantity using the variantId
        await this.updateItemQuantity(variant.id, newQuantity);
      } else {
        // If it's a new item, add it
        // 1. Optimistic UI Update (No temporary ID needed!)
        const newItem: ICartItem = {
          id: `local-${variant.id}`, // A temporary local-only ID (string)
          variant,
          quantity,
          variantId: variant.id,
          userId: userStore.user?.id || '',
          created_at: new Date(),
          product,
        };
        this.cartItems.set(variant.id, newItem);

        // 2. Sync with DB if logged in
        if (userStore.isLoggedIn) {
          try {
            // The API call is simple: just send variantId and quantity
            const savedItem = await apiService.addCartItem(variant.id, quantity);
            
            // 3. Reconcile: Update the item in the map with the real one from the DB
            // This replaces the `local-` ID with the real database ID.
            this.cartItems.set(variant.id, { ...savedItem, product: product });

          } catch (error) {
            notify({ type: 'error', text: 'Could not add item to your cart.' });
            // Rollback optimistic update on failure
            this.cartItems.delete(variant.id);
          }
        }
      }
    },

    /**
     * Updates the quantity of a specific item in the cart using its variantId.
     */
    async updateItemQuantity(variantId: number, quantity: number) {
      const userStore = useUserStore();
      const apiService = useApiService();

      // Find the item by variantId
      const item = this.cartItems.get(variantId);
      if (!item) return;

      const originalQuantity = item.quantity;

      // Optimistic update
      item.quantity = quantity;

      if (userStore.isLoggedIn) {
        try {
          await apiService.updateCartItem(variantId, quantity);
        } catch (error) {
          // Rollback on failure
          item.quantity = originalQuantity;
          notify({ type: 'error', text: 'Could not update item quantity.' });
        }
      }
    },

    /**
     * Removes an item from the cart using its variantId.
     */
    async removeFromCart(variantId: number) {
      const userStore = useUserStore();
      const apiService = useApiService();

      // Find the item to remove
      const itemToRemove = this.cartItems.get(variantId);
      if (!itemToRemove) return;

      // Optimistic removal
      this.cartItems.delete(variantId);

      if (userStore.isLoggedIn) {
        try {
          await apiService.removeCartItem(variantId);
        } catch (error) {
          // Rollback on failure
          this.cartItems.set(variantId, itemToRemove);
          notify({ type: 'error', text: 'Could not remove item from cart.' });
        }
      }
    },

    prepareForCheckout(selectedItems: ICartItem[]) {
      if (selectedItems.length === 0) return;
      this.checkout = [...selectedItems];
      useRouter().push('/buyer/shipping/checkout');
    },

    async clearPurchasedItems() {
      const userStore = useUserStore();
      const apiService = useApiService();

      // This logic is now much simpler
      const variantIdsToRemove = this.checkout.map(item => item.variantId);

      // Remove purchased items from the local cart map
      variantIdsToRemove.forEach(variantId => {
        this.cartItems.delete(variantId);
      });
      this.checkout = [];

      // Call the API to remove items from the DB
      if (userStore.isLoggedIn) {
        try {
          await Promise.all(
            variantIdsToRemove.map(variantId => apiService.removeCartItem(variantId))
          );
        } catch (error) {
          console.error("Failed to clear purchased items from DB:", error);
          // Note: We don't roll back here, as the purchase was successful.
          // The cart will re-sync on the next page load if needed.
        }
      }
    },
  },
  persist: {
    // We must serialize the Map to a plain object for persistence
    // and deserialize it back into a Map when rehydrating.
    serializer: {
      serialize: (state) => {
        const plainObject = { ...state };
        // Convert Map to a [key, value] array
        plainObject.cartItems = Array.from(state.cartItems.entries());
        return JSON.stringify(plainObject);
      },
      deserialize: (json) => {
        const plainObject = JSON.parse(json);
        // Convert the [key, value] array back into a Map
        plainObject.cartItems = new Map(plainObject.cartItems);
        return plainObject;
      },
    },
  },
});