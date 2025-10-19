<template>
    <div class="min-h-screen bg-gray-50">
        <!-- Header -->
        <header class="bg-white shadow-sm sticky top-0 z-10">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 py-4">
                <div v-if="pending" class="flex items-center gap-4 animate-pulse">
                    <div class="w-16 h-16 rounded-full bg-gray-200"></div>
                    <div class="space-y-2">
                        <div class="h-6 w-48 bg-gray-300 rounded"></div>
                        <div class="h-4 w-64 bg-gray-200 rounded"></div>
                    </div>
                </div>
                <div v-else-if="userProfile" class="flex items-center gap-4">
                    <img :src="userProfile.avatar || '/default-avatar.png'" class="w-16 h-16 rounded-full border-2 border-gray-200">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">{{ userProfile.username || 'My Profile' }}</h1>
                        <p class="text-sm text-gray-500 mt-1">{{ userProfile.email }}</p>
                    </div>
                </div>
            </div>
        </header>

        <main class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            <div>
                <div class="border-b border-gray-200 mb-6">
                    <nav class="-mb-px flex space-x-6" aria-label="Tabs">
                        <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" 
                            class="py-3 px-1 border-b-2 font-medium text-sm transition-colors"
                            :class="[activeTab === tab.id ? 'border-[#f02c56] text-brand' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300']">
                            {{ tab.name }}
                        </button>
                    </nav>
                </div>

                <!-- Tab Content -->
                <div>
                    <!-- My Orders Tab now uses the new component -->
                    <div v-if="activeTab === 'orders'">
                        <OrderSection :orders="orders" :pending="pending" :error="error" />
                    </div>
                    
                    <!-- Shipping Address Tab -->
                    <div v-if="activeTab === 'address'">
                        <div v-if="pending" class="bg-gray-200 rounded-xl h-32 animate-pulse"></div>
                        <div v-else class="bg-white rounded-xl shadow-sm p-6 border">
                            <div class="flex items-center justify-between">
                                <h3 class="text-lg font-semibold">Shipping Address</h3>
                                <NuxtLink to="/shipping/address" class="text-sm font-medium text-brand hover:underline">
                                    {{ address ? 'Edit Address' : 'Add Address' }}
                                </NuxtLink>
                            </div>
                            <div v-if="address" class="mt-4 pt-4 border-t text-sm text-gray-600 space-y-1">
                                <p><strong>{{ address.name }}</strong></p>
                                <p>{{ address.address }}, {{ address.county }}</p>
                                <p>{{ address.state }}, {{ address.country }}</p>
                            </div>
                            <div v-else class="mt-4 pt-4 border-t text-sm text-gray-500">
                                No shipping address on file.
                            </div>
                        </div>
                    </div>

                    <!-- Profile Settings Tab -->
                    <div v-if="activeTab === 'settings'" class="bg-white rounded-xl shadow-sm p-6 border">
                         <h3 class="text-lg font-semibold">Profile Settings</h3>
                         <p class="mt-4 text-sm text-gray-500">Feature coming soon.</p>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useUserStore, useShippingStore, useOrderStore } from '~/stores';
import OrderSection from '~/components/buyer/profile/OrderSection.vue';

definePageMeta({ layout: 'profile-layout' });

const userStore = useUserStore();
const shippingStore = useShippingStore();
const orderStore = useOrderStore();

const activeTab = ref('orders');
const tabs = [
    { id: 'orders', name: 'My Orders' },
    { id: 'address', name: 'Shipping Address' },
    { id: 'settings', name: 'Profile Settings' },
];

// `useAsyncData` fetches all necessary data for the profile page in one go.
const { data, pending, error } = await useAsyncData(
    'buyer-profile-data',
    async () => {
        if (!userStore.isLoggedIn) {
            if (import.meta.server) await navigateTo('/auth/login');
            return null;
        }
        // Fetch everything in parallel for maximum performance
        const [orders, address, userProfile] = await Promise.all([
            orderStore.fetchBuyerOrderHistory(),
            shippingStore.fetchAddress(),
            userStore.fetchUserAndProfile() // This ensures userProfile is populated
        ]);
        return { orders, address };
    }
);

// Computed properties read from the fetched data or the store's cache.
const orders = computed(() => data.value?.orders || []);
const address = computed(() => data.value?.address || null);
const userProfile = computed(() => userStore.userProfile);

</script>


