import { defineStore } from 'pinia';
import type { ProductInterface, ProductVariantInterface } from '~/models/interface/products/product.interface';
import type { CartItemInterface } from '~/models/interface/cart/cart.interface'; // Import your new interface
import { useSupabaseClient, useSupabaseUser } from '#imports';
import type { Database } from '#build/types/supabase-database';

export const useCartStore = defineStore('cart', {
  state: () => ({
    // The state now uses the correct, variant-aware interface
    cartItems: [] as CartItemInterface[],
    checkout: [] as CartItemInterface[],
  }),
  getters: {
    cartCount: (state) => state.cartItems.length,
    // Calculates the total price of all items in the cart
    cartTotal: (state) => {
        return state.cartItems.reduce((total, item) => {
            const price = item.variant.price || item.product.price;
            return total + (price * item.quantity);
        }, 0);
    }
  },
  actions: {
    // Note: The fetchCartItems action would also need to be updated to fetch variant data.
    // This is a placeholder for that logic.
    async fetchCartItems() {
      // This logic would need to be adapted based on your 'cart_items' table structure
      // to include a 'variant_id' and join with the ProductVariant table.
      console.log("Fetching cart items from the database...");
    },

    addToCart(product: ProductInterface, selectedVariant: ProductVariantInterface, quantity = 1) {
      
      if (quantity <= 0) return;

      // Create a unique ID for this specific cart item (e.g., "productID-variantID")
      alert(`Adding to cart: ${product.id} - ${Number(selectedVariant.id)}`);
      const cartId = `${product.id}-${Number(selectedVariant.id)}`;

      const existingItem = this.cartItems.find(item => String(item.id) === cartId);

      if (existingItem) {
        // If it already exists, just increase the quantity, respecting stock limits
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity <= selectedVariant.stock) {
            existingItem.quantity = newQuantity;
        } else {
            // Optionally notify the user that they can't add more than what's in stock
            console.warn('Cannot add more items than available in stock.');
        }
      } else {
        // Otherwise, add the new item to the cart
        this.cartItems.push({
          id: cartId,
          product: product,
          variant: selectedVariant,
          quantity: quantity,
        });
      }
    },

    // removeFromCart now uses the unique cartId, which is much more reliable
    removeFromCart(cartId: string) {
      this.cartItems = this.cartItems.filter(item => String(item.id) !== cartId);
    },

    // updateCartItem also uses the unique cartId
    updateCartItem(updatedItem: CartItemInterface) {
      const index = this.cartItems.findIndex(item => item.id === updatedItem.id);
      if (index !== -1) {
        this.cartItems[index] = updatedItem;
      } else {
        console.warn(`Item with id ${updatedItem.id} not found in cart.`);
      }
    },
  },
});