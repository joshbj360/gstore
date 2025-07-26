import { defineStore } from 'pinia';
import type { ProductInterface } from '~/models/interface/products/product.interface';
import { type CartInterface } from '~/models/interface/cart/cart.interface';
import type { Database } from '#build/types/supabase-database';

export const useCartStore = defineStore('cart', {
  state: () => ({
    cartItems: [] as Array<CartInterface>,
    checkout: [] as Array<CartInterface>,
  }),
  getters: {
    cartCount: (state) => state.cartItems.length,
  },
  actions: {
    async fetchCartItems() {
      const supabase = useSupabaseClient<Database>();
      const user = useSupabaseUser();
      if (user.value) {
        const { data, error } = await supabase
          .from('cart_items')
          .select('*, products(*)')
          .eq('user_id', user.value.id);
        if (error) throw new Error('Failed to fetch cart items');
        this.cartItems = data.map((item: any) => ({
          ...item.products,
          quantity: item.quantity && item.quantity > 0 ? item.quantity : 1,
          selectedSizes: item.selected_sizes || [],
        }));
      }
    },
    addToCart(item: ProductInterface, quantity = 1, selectedSizes: string[] = []) {
      if (quantity <= 0) {
        console.warn('Quantity must be positive');
        return;
      }
      const existingItem = this.cartItems.find(
        (i) =>
          i.id === item.id &&
          JSON.stringify(i.selectedSizes?.sort()) === JSON.stringify(selectedSizes.sort())
      );
      if (!existingItem) {
        this.cartItems.push({
          id: item.id!,
          product: item,
          quantity,
          selectedSizes
        });
        console.log('Added to cart:', {
          id: item.id!,
          product: item,
          quantity,
          selectedSizes
        });
      }
    },
    removeFromCart(itemId: number, selectedSizes: string[] = []) {
      this.cartItems = this.cartItems.filter(
        (i) =>
          !(i.id === itemId && JSON.stringify(i.selectedSizes?.sort()) === JSON.stringify(selectedSizes.sort()))
      );
    },
    updateCartItem(updatedItem: CartInterface) {
      const index = this.cartItems.findIndex(
        (item) =>
          item.id === updatedItem.id &&
          JSON.stringify(item.selectedSizes?.sort()) === JSON.stringify(updatedItem.selectedSizes?.sort())
      );
      if (index !== -1) {
        // Update the existing item with new values
        this.cartItems[index] = {
          ...this.cartItems[index],
          ...updatedItem,
          quantity: updatedItem.quantity || this.cartItems[index].quantity, // Preserve existing quantity if new is invalid
        };
      } else {
        console.warn(`Item with id ${updatedItem.id} and sizes ${updatedItem.selectedSizes} not found in cart`);
      }
    },
  },
});