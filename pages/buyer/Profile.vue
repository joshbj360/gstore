<template>
    <!-- 
      THE FIX: The root `bg-gray-50` is removed. The layout now controls the background.
    -->
    <div class="min-h-screen">
        <!-- Header -->
        <header class="bg-white dark:bg-neutral-950 shadow-sm sticky top-0 z-10 border-b border-gray-200 dark:border-neutral-800">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 py-4">
                <!-- Header Skeleton -->
                <div v-if="pending" class="flex items-center gap-4 animate-pulse">
                    <div class="w-16 h-16 rounded-full bg-gray-200 dark:bg-neutral-800"></div>
                    <div class="space-y-2">
                        <div class="h-6 w-48 bg-gray-300 dark:bg-neutral-700 rounded"></div>
                        <div class="h-4 w-64 bg-gray-200 dark:bg-neutral-700 rounded"></div>
                    </div>
                </div>
                <!-- Header Content -->
                <div v-else-if="userProfile" class="flex items-center gap-4">
                    <img :src="userProfile.avatar || formatAvatarUrl(userProfile.username)" class="w-16 h-16 rounded-full border-2 border-gray-200 dark:border-neutral-700">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900 dark:text-neutral-100">{{ userProfile.username || 'My Profile' }}</h1>
                        <p class="text-sm text-gray-500 dark:text-neutral-400 mt-1">{{ userProfile.email }}</p>
                    </div>

                    <div class="ml-auto">
                        <button @click="logout" class="text-sm text-[#f02c56] hover:underline mt-2 font-semibold">Logout</button>
                    </div>
                </div>
            </div>
        </header>

        <main class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            <div>
                <!-- Tabs -->
                <div class="border-b border-gray-200 dark:border-neutral-700 mb-6">
                    <nav class="-mb-px flex space-x-6" aria-label="Tabs">
                        <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" 
                            class="py-3 px-1 border-b-2 font-medium text-sm transition-colors"
                            :class="[
                              activeTab === tab.id 
                                ? 'border-[#f02c56] text-[#f02c56]' 
                                : 'border-transparent text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200 hover:border-gray-300 dark:hover:border-neutral-600'
                            ]">
                            {{ tab.name }}
                        </button>
                    </nav>
                </div>

                <!-- Tab Content -->
                <div>
                    <!-- My Orders Tab -->
                    <div v-if="activeTab === 'orders'">
                        <OrderSection :orders="orders" :pending="pending" :error="error" />
                    </div>
                    
                    <!-- Shipping Address Tab -->
                    <div v-if="activeTab === 'address'">
                        <div v-if="pending" class="bg-gray-200 dark:bg-neutral-800 rounded-xl h-32 animate-pulse"></div>
                        <div v-else class="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-neutral-800">
                            <div class="flex items-center justify-between">
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-neutral-100">Shipping Address</h3>
                                <NuxtLink to="/shipping/address" class="text-sm font-medium text-[#f02c56] hover:underline">
                                    {{ address ? 'Edit Address' : 'Add Address' }}
                                </NuxtLink>
                            </div>
                            <div v-if="address" class="mt-4 pt-4 border-t border-gray-200 dark:border-neutral-700 text-sm text-gray-600 dark:text-neutral-300 space-y-1">
                                <p><strong>{{ address.name }}</strong></p>
                                <p>{{ address.address }}, {{ address.county }}</p>
                                <p>{{ address.state }}, {{ address.country }}</p>
                            </div>
                            <div v-else class="mt-4 pt-4 border-t border-gray-200 dark:border-neutral-700 text-sm text-gray-500 dark:text-neutral-400">
                                No shipping address on file.
                            </div>
                        </div>
                    </div>

                    <!-- Profile Settings Tab -->
                    <div v-if="activeTab === 'settings'" class="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-neutral-800">
                         <h3 class="text-lg font-semibold text-gray-900 dark:text-neutral-100">Profile Settings</h3>
                         <p class="mt-4 text-sm text-gray-500 dark:text-neutral-400">Feature coming soon.</p>
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

// THE FIX: Define the layout using the `definePageMeta` compiler macro
definePageMeta({ layout: 'home-layout' });

const userStore = useUserStore();
const shippingStore = useShippingStore();
const orderStore = useOrderStore();
const router = useRouter();

const activeTab = ref('orders');
const tabs = [
    { id: 'orders', name: 'My Orders' },
    { id: 'address', name: 'Shipping Address' },
    { id: 'settings', name: 'Profile Settings' },
];

// `useAsyncData` fetches all necessary data for the profile page in one go.
const { data, pending, error } = await useLazyAsyncData(
    'buyer-profile-data',
    async () => {
        if (!userStore.isLoggedIn) {
            if (process.server) await navigateTo('/auth/login');
            return null;
        }

        // THE FIX: Fetch the user profile first, as other calls depend on it.
        await userStore.fetchUserAndProfile();
        
        // Now that we have the user ID, we can safely run the other fetches in parallel.
        const [orders, address] = await Promise.all([
            orderStore.fetchBuyerOrderHistory(),
            shippingStore.fetchAddress()
        ]);

        return { orders, address };
    },
    { default: () => ({ orders: [], address: null }) }
);

// Computed properties read from the fetched data or the store's cache.
const orders = computed(() => orderStore.buyerOrders); // Read from the store's cache
const address = computed(() => shippingStore.address); // Read from the store's cache
const userProfile = computed(() => userStore.userProfile);

const logout = async () => {
    await userStore.logout();
    await router.push('/auth/login');
};
</script>
