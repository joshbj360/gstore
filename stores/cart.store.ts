import { defineStore } from 'pinia';
import { useUserStore } from './user.store';
import type { ProductInterface, ProductVariantInterface } from '~/models/interface/products/product.interface';
import type { CartItemInterface } from '~/models/interface/cart/cart.interface';
import { notify } from "@kyvg/vue3-notification";

export const useCartStore = defineStore('cart', {
  state: () => ({
    cartItems: [] as CartItemInterface[],
    checkout: [] as CartItemInterface[],
    isLoading: false,
  }),

  getters: {
    cartCount: (state) => state.cartItems.length,
    cartTotal: (state) => {
      return state.cartItems.reduce((total, item) => {
        const price = item.variant.price || item.product.price;
        return total + (price * item.quantity);
      }, 0);
    },
  },

  actions: {
    /**
     * Fetches the user's cart from the database if they are logged in.
     * For guests, this does nothing, allowing the persist plugin to load from localStorage.
     */
    async fetchCartItems() {
      const userStore = useUserStore();
      if (!userStore.isLoggedIn) return;

      this.isLoading = true;
      try {
        const dbItems = await $fetch<CartItemInterface[]>('/api/prisma/cart/get-cart-items');

        // Map the database response to the frontend CartItemInterface
        this.cartItems = dbItems.map((item: any) => ({
            id: `${item.variant.product.id}-${item.variant.id}`,
            product: item.variant.product,
            variant: item.variant,
            quantity: item.quantity,
        }));
      } catch (error) {
        console.error("Failed to fetch cart from DB:", error);
        notify({ type: 'error', text: 'Could not load your cart.' });
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Adds a specific product variant to the cart.
     * Updates the UI optimistically, then syncs with the database.
     */
    async addToCart(product: ProductInterface, variant: ProductVariantInterface, quantity = 1) {
      const userStore = useUserStore();
      const cartId = `${product.id}-${variant.id}`;
      const existingItem = this.cartItems.find(item => item.id === cartId);

      // Optimistic UI update for a snappy experience
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        this.cartItems.push({ id: cartId, product, variant, quantity });
      }

      // Sync the change with the database if the user is logged in
      if (userStore.isLoggedIn) {
        try {
          await $fetch('/api/prisma/cart/create-cart-item', {
            method: 'POST',
            body: { variantId: variant.id, quantity },
          });
        } catch (error) {
          console.error("Failed to sync cart addition with DB:", error);
          // Optional: Revert the change in the UI if the API call fails
          notify({ type: 'error', text: 'Could not save item to cart.' });
        }
      }
    },

    /**
     * Removes an item from the cart using its unique cartId.
     */
    async removeFromCart(cartId: string) {
      const userStore = useUserStore();
      const itemIndex = this.cartItems.findIndex(item => item.id === cartId);
      if (itemIndex === -1) return;
      
      const variantId = this.cartItems[itemIndex].variant.id;
      
      // Optimistic UI update
      this.cartItems.splice(itemIndex, 1);

      if (userStore.isLoggedIn) {
        try {
          await $fetch('/api/prisma/cart', {
            method: 'DELETE',
            body: { variantId },
          });
        } catch (error) {
          console.error("Failed to sync cart removal with DB:", error);
          notify({ type: 'error', text: 'Could not remove item from cart.' });
        }
      }
    },

    /**
     * Updates the quantity of a specific item in the cart.
     */
    async updateCartItem(updatedItem: CartItemInterface) {
      const userStore = useUserStore();
      const index = this.cartItems.findIndex(item => item.id === updatedItem.id);
      if (index !== -1) {
        this.cartItems[index].quantity = updatedItem.quantity;
        
        if (userStore.isLoggedIn) {
            try {
                await $fetch('/api/prisma/cart', {
                    method: 'PATCH', // Or PUT, depending on your API design
                    body: { 
                        variantId: updatedItem.variant.id, 
                        quantity: updatedItem.quantity 
                    },
                });
            } catch (error) {
                console.error("Failed to sync quantity update with DB:", error);
                notify({ type: 'error', text: 'Could not update item quantity.' });
            }
        }
      }
    },
  },
  
  // This enables localStorage caching, which is perfect for guest users.
  persist: true,
});