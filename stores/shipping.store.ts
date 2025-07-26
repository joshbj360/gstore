// stores/shipping.store.ts
import { defineStore } from 'pinia';
import { defaultShippingAddress, type ShippingAddressInterface } from '~/models/interface/shipping/address.interface';

export const useShippingStore = defineStore('shipping', {
  state: () => ({
    address: null as ShippingAddressInterface | null,
    loading: false,
    error: null as string | null,
  }),
  actions: {
    async fetchAddress(userId: string) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await useFetch(`/api/prisma/get-address-by-user/${userId}`, {
          default: () => null,
        });
        this.setAddress(
          data.value && Object.keys(data.value).length > 0
            ? (data.value as ShippingAddressInterface)
            : defaultShippingAddress
        );
      } catch (err) {
        this.error = 'Failed to fetch address. Please try again.';
        console.error(err);
      } finally {
        this.loading = false;
      }
    },
    setAddress(address: ShippingAddressInterface | null) {
      this.address = address;
    },
  },
  getters: {
    hasAddress: (state) => !!state.address && !!state.address.address,
  },
});