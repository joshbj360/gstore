<template>
    <div class="min-h-screen bg-gray-50">
        <header class="bg-white shadow-sm sticky top-0 z-10">
            <div class="max-w-5xl mx-auto px-4 sm:px-6 py-4">
                <h1 class="text-2xl font-bold text-gray-900">Shipping Profiles</h1>
                <p class="text-sm text-gray-500 mt-1">Create and manage where you ship and how much you charge.</p>
            </div>
        </header>

        <main class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            <div class="text-right mb-4">
                <button @click="openZoneModal()" class="bg-brand text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#d81b36] transition-transform hover:scale-105">
                    Create New Profile
                </button>
            </div>

            <!-- List of Existing Shipping Zones -->
            <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                <div v-if="isLoading" class="p-12 text-center text-gray-500">Loading shipping profiles...</div>
                <div v-else-if="shippingZones.length === 0" class="text-center p-12 text-gray-500">
                    <p>You haven't created any shipping profiles yet.</p>
                </div>
                <ul v-else class="divide-y divide-gray-200">
                    <li v-for="zone in shippingZones" :key="zone.id" class="p-4 sm:p-6 hover:bg-gray-50">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="font-semibold text-gray-800">{{ zone.name }} <span v-if="zone.isDefault" class="text-xs font-medium bg-gray-200 text-gray-600 px-2 py-1 rounded-full ml-2">Default</span></h3>
                                <p class="text-sm text-gray-500 mt-1">{{ generateZoneDescription(zone) }}</p>
                            </div>
                            <div class="flex gap-2">
                                <button @click="openZoneModal(zone)" class="text-sm font-medium text-brand hover:underline">Edit</button>
                                <button @click="deleteZone(zone.id)" class="text-sm font-medium text-brand hover:underline">Delete</button>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
        </main>

        <!-- Modal for Creating/Editing a Shipping Zone -->
        <ShippingZoneModal 
            v-if="isModalOpen" 
            :zone="selectedZone"
            @close="isModalOpen = false"
            @save="handleSaveZone"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import ShippingZoneModal from '@/components/seller/dashboard/ShippingZoneModal.vue'
import type { ShippingZone } from '@prisma/client'; // Assuming you have run `prisma generate`
import { notify } from "@kyvg/vue3-notification";

definePageMeta({ layout: 'home-layout' });

const shippingZones = ref<ShippingZone[]>([]); 
const isModalOpen = ref(false);
const selectedZone = ref<any | null>(null);
const isLoading = ref(true);

const fetchShippingZones = async () => {
    isLoading.value = true;
    try {
        const zones = await $fetch<ShippingZone[]>('/api/prisma/shipping/zones');
        shippingZones.value = zones;
    } catch (error) {
        notify({ type: 'error', text: 'Could not load shipping profiles.' });
    } finally {
        isLoading.value = false;
    }
};

const openZoneModal = (zone: any | null = null) => {
    selectedZone.value = zone;
    isModalOpen.value = true;
};

const handleSaveZone = async (zoneData: any) => {
    try {
        await $fetch('/api/prisma/shipping/zones', {
            method: 'POST',
            body: zoneData,
        });
        notify({ type: 'success', text: `Shipping profile "${zoneData.name}" saved successfully!` });
        await fetchShippingZones(); // Refresh the list
    } catch (error: any) {
        notify({ type: 'error', text: error.data?.message || 'Failed to save profile.' });
    } finally {
        isModalOpen.value = false;
    }
};

const deleteZone = async (zoneId: string) => {
    if (confirm('Are you sure you want to delete this shipping profile? This cannot be undone.')) {
        try {
            await $fetch(`/api/prisma/shipping/zones`, {
                method: 'DELETE',
                body: { id: zoneId }
            });
            notify({ type: 'success', text: 'Shipping profile deleted.' });
            await fetchShippingZones(); // Refresh the list
        } catch (error: any) {
            notify({ type: 'error', text: error.data?.message || 'Failed to delete profile.' });
        }
    }
};

const generateZoneDescription = (zone: any) => {
    const rateCount = zone.rates?.length || 0;
    if (rateCount === 0) return "No rates configured.";
    const countryCount = new Set(zone.rates.flatMap((r: any) => r.countries)).size;
    if (countryCount > 0) {
        return `${rateCount} rate(s) covering ${countryCount} countries.`;
    }
    return `${rateCount} rate(s) configured.`;
};

onMounted(fetchShippingZones);
</script>
