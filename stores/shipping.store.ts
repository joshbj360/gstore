// stores/shipping.store.ts
import { defineStore } from 'pinia';
import { defaultShippingAddress, type ShippingAddressInterface } from '~/models/interface/shipping/address.interface';
import { notify } from '@kyvg/vue3-notification'
import type { ShippingZoneInterface } from '~/models/interface/shipping/shipping.interface';

export const useShippingStore = defineStore('useShippingStore', {
  state: () => ({
    address: null as ShippingAddressInterface | null,
    shippingZones: [] as ShippingZoneInterface[],
    isLoadingZones: false,
    loading: false,
    error: null as string | null,
  }),
  actions: {
    async fetchAddress(userId: string) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await useFetch<ShippingAddressInterface>(`/api/prisma/address/get-address-by-user/${userId}`, {
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
    async addAddress(address: ShippingAddressInterface) {
      this.loading =  true,
      this.error = null
      try {
        await $fetch('/api/prisma/address/add-address', 
          { method: 'POST', body: address });
          this.setAddress(address)
      } catch (err) {
        this.error = 'Failed to add address.'
        console.error(this.error, err)
      } finally {
        this.loading = false
      }
    },
    async updateAddress(address: ShippingAddressInterface) {
      this.loading = true;
      this.error = null;
      try {
        await useFetch(`/api/prisma/address/update-address/${address.id}`, {
          method: 'PATCH',
          body: address,
        });
        this.setAddress(address);
      } catch (err) {
        this.error = 'Failed to update address. Please try again.';
        console.error(err);
      } finally {
        this.loading = false;
      }
    },
    async fetchShippingZones() {
      // If zones are already cached, return immediately for speed.
      if (this.shippingZones.length > 0) {
        return;
      }

      this.isLoadingZones = true;
      try {
        const zones = await $fetch<ShippingZoneInterface[]>('/api/prisma/shipping/zones');
        this.shippingZones = zones;
      } catch (error) {
        notify({ type: 'error', text: 'Could not load your shipping profiles.' });
        this.shippingZones = []; // Reset on error
      } finally {
        this.isLoadingZones = false;
      }
    },
  },
  getters: {
    hasAddress: (state) => !!state.address && !!state.address.address,
  },
});

