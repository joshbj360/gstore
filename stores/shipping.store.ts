import { defineStore } from 'pinia';
import { useApiService } from '~/services/api/apiService';
import type { IAddress, IShippingZone } from '~/models';
import { notify } from '@kyvg/vue3-notification';

export const useShippingStore = defineStore('shipping', {
  state: () => ({
    address: null as IAddress | null,
    shippingZones: [] as IShippingZone[],
    isLoading: false,
  }),

  getters: {
    hasAddress: (state) => !!state.address && !!state.address.address,
  },

  actions: {
    /**
     * Fetches the current user's address from the API.
     * Crucially, it now RETURNS the address, making it compatible with useAsyncData.
     */
    async fetchAddress(): Promise<IAddress | null> {
      // If address is already in state, return it instantly.
      if (this.address) return this.address;

      this.isLoading = true;
      try {
        const apiService = useApiService();
        const addressData = await apiService.getAddress();
        if (!addressData) {
          this.address = null;
        }
        this.address = addressData;
        return addressData// THE FIX: Return the fetched data.
      } catch (err) {
        console.error('Failed to fetch address:', err);
        return null; // Return null on error.
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Saves (creates or updates) the user's shipping address via the API.
     */
    async saveAddress(addressData: IAddress): Promise<boolean> {
        this.isLoading = true;
        try {
            const apiService = useApiService();
            console.log(addressData, 'addressData');
            const savedAddress = await apiService.saveAddress(addressData);
            if (!savedAddress) {
                notify({ type: 'error', text: 'Failed to save address.' });
                return false;
            }
            this.address = savedAddress;
            notify({ type: 'success', text: 'Address saved successfully!' });
            return true;
        } catch (error) {
            notify({ type: 'error', text: 'Failed to save address.' });
            return false;
        } finally {
            this.isLoading = false;
        }
    },

    /**
     * Fetches the seller's shipping zones if they haven't been loaded yet.
     */
    async fetchShippingZones() {
      if (this.shippingZones.length > 0) return;
      
      this.isLoading = true;
      try {
        const apiService = useApiService();
        // Assuming you have a getShippingZones method in your apiService
        const zones = await apiService.getShippingZones(); 
        this.shippingZones = zones;
      } catch (error) {
        notify({ type: 'error', text: 'Could not load shipping profiles.' });
      } finally {
        this.isLoading = false;
      }
    },
  },
});
