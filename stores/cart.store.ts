import { defineStore } from 'pinia';
import { useUserStore } from './user.store';
import { useApiService } from '~/services/api/apiService';
import type { IProductVariant, ICartItem, IPartialCartItem, IProduct } from '~/models';

export const useCartStore = defineStore('cart', {
  state: () => ({
    cartItems: [] as ICartItem[],
    checkout: [] as ICartItem[],
    isLoading: false,
    hasSyncedWithDB: false, // New flag to track if we've synced with DB
    statusMessage: { type: '', text: '' } as { type: string; text: string } | null,
  }),

  getters: {
    cartCount: (state) => state.cartItems.length,
    cartTotal: (state) => {
      return state.cartItems.reduce((total, item) => {
        const price = item.variant.price;
        return total + (price * item.quantity);
      }, 0);
    },

  },

  actions: {
    /**
   * Initializes the cart. Fetches from the DB for logged-in users, but only once.
   * This should be called from a central location like app.vue when the app loads.
   */
    async initializeCart() {
      const userStore = useUserStore();
      // Don't run if user is a guest or if we have already synced.
      if (!userStore.isLoggedIn || this.hasSyncedWithDB) {
        return;
      }

      this.isLoading = true;
      try {
        const apiService = useApiService();
        const dbItems = await apiService.getCartItems();

        // This is a one-time replacement of the local state with the DB state.
        this.cartItems = dbItems.map((item: any) => ({
          id: `${item.variant.product.id}-${item.variant.id}`,
          variant: item.variant,
          quantity: item.quantity,
          variantId: item.variant.id,
          userId: item.userId,
          created_at: item.created_at,
          product: item.variant.product,
          productId: item.variant.product.id,
        }));

        // Set the flag to prevent this action from running again during this session.
        this.hasSyncedWithDB = true;
      } catch (error) {
        console.error("Failed to initialize cart from DB:", error);
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * When a guest with items in their cart logs in, this action syncs their
     * local cart with the database.
     */
    async mergeAndSyncCartOnLogin() {
      const userStore = useUserStore();
      const apiService = useApiService();
      if (!userStore.isLoggedIn) return;

      try {
        // Send each item from the guest cart (currently in state) to the backend
        for (const item of this.cartItems) {
          const partialItem: IPartialCartItem = {userId: userStore.user?.id || '', variantId: item.variant.id, quantity: item.quantity };
          await apiService.addCartItem(partialItem);
        }
        // After merging, fetch the definitive, combined cart from the DB
        this.hasSyncedWithDB = false; // Reset the flag to allow a fresh fetch
        await this.initializeCart();
      } catch (error) {
        console.error("Failed to merge guest cart:", error);
      }
    },

    /**
     * Adds a specific product variant to the cart.
     * If the item already exists, it increments the quantity.
     */
    async addToCart(productId: number, variant: IProductVariant, quantity = 1, product: IProduct) {
      const userStore = useUserStore();
      const apiService = useApiService();
      const cartId = `${productId}-${variant.id}`;
      const existingItem = this.cartItems.find(item => item.id === cartId);

      console.log("Adding to cart:", { productId, variant, quantity, userId: userStore.user?.id }); //TODO remove 

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        this.cartItems.push({
          id: cartId,
          variant,
          quantity,
          variantId: variant.id,
          userId: userStore.user?.id || '',
          created_at: new Date(),
          product,
        });
      }

      if (userStore.isLoggedIn) {
        try {
          // await useFetch<ICartItem>('/api/prisma/cart/add/', {
          //   method: 'POST',
          //   body: {userId: userStore.user?.id,   variantId: variant.id, quantity: quantity },
          // })
          const partialItem = { userId: userStore.user?.id || '', variantId: variant.id, quantity: quantity };
          await apiService.addCartItem(partialItem)
        } catch (error) {
          this.statusMessage = ({ type: 'error', text: 'Could not sync item with your cart.' });
        }
      }
    },   /**
     * NEW ACTION: Takes the selected items from the cart page and prepares them for checkout.
     * This is called when the user clicks "Proceed to Checkout".
     */
    prepareForCheckout(selectedItems: ICartItem[]) {
      if (selectedItems.length === 0) {
        this.statusMessage = { type: 'warn', text: 'Please select items to checkout.' }
        return;
      }
      this.checkout = [...selectedItems]; // Create a copy
      useRouter().push('/buyer/shipping/checkout');
    },

    /**
     * Clears the main cart of items that were successfully purchased.
     */
    clearPurchasedItems() {
      const checkoutIds = new Set(this.checkout.map(item => item.id));
      this.cartItems = this.cartItems.filter(item => !checkoutIds.has(item.id));
      this.checkout = []; // Clear the checkout snapshot

      // Here, you would also call an API to remove these items from the database cart
    },

    /**
     * Removes an item from the cart using its unique cartId.
     */
    async removeFromCart(cartId: string) {
      const userStore = useUserStore();
      const apiService = useApiService();
      const itemIndex = this.cartItems.findIndex(item => item.id === cartId);
      if (itemIndex === -1) return;

      const variantId = this.cartItems[itemIndex].variant.id;
      this.cartItems.splice(itemIndex, 1);

      if (userStore.isLoggedIn) {
        try {
          await apiService.removeCartItem(variantId);
        } catch (error) {
          this.statusMessage = ({ type: 'error', text: 'Could not remove item from your cart.' });
        }
      }
    },

    /**
     * Updates the quantity of a specific item in the cart.
     */
    async updateCartItem(updatedItem: ICartItem) {
      const userStore = useUserStore();
      const apiService = useApiService();
      const index = this.cartItems.findIndex(item => item.id === updatedItem.id);

      if (index !== -1) {
        this.cartItems[index].quantity = updatedItem.quantity;

        if (userStore.isLoggedIn) {
          try {
            await apiService.updateCartItem(updatedItem.variant.id, updatedItem.quantity);
          } catch (error) {
            this.statusMessage = ({ type: 'error', text: 'Could not update item quantity.' });
          }
        }
      }
    },

    /**
      * Resets the cart state on logout.
      */
    resetCart() {
      this.cartItems = [];
      this.checkout = [];
      this.hasSyncedWithDB = false;
    },

    async fetchOrGetProductById(id: number) {
      const productStore = useProductStore();

      // If not found, fetch it from the API
      return await productStore.fetchProductById(id);
    },

    // Persists the cart in localStorage, perfect for guest users.
    persist: true,
  },
});

