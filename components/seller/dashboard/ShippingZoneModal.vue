<template>
    <div class="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div class="p-4 border-b flex justify-between items-center">
                <h2 class="text-lg font-semibold">{{ isEditing ? 'Edit' : 'Create' }} Shipping Profile</h2>
                <button @click="$emit('close')" class="p-2 rounded-full hover:bg-gray-100">
                    <Icon name="mdi:close" size="24" />
                </button>
            </div>

            <div class="p-6 space-y-6 overflow-y-auto">
                <TextInput v-model:input="zone.name" label="Profile Name" placeholder="e.g., West Africa Shipping, Lagos Express" required />

                <div>
                    <h3 class="font-medium mb-2 text-gray-800">Shipping Rates</h3>
                    <div v-for="(rate, index) in zone.rates" :key="index" class="p-4 border rounded-md mb-3 bg-gray-50/50 space-y-3">
                        <div class="flex items-end gap-3">
                            <div class="flex-1">
                                <label class="block text-sm font-medium text-gray-700">Countries</label>
                                <p class="text-xs text-gray-500 mb-1">Select countries for this rate. Leave empty for "Rest of World".</p>
                                <!-- In a real app, you'd use a multi-select component with country data -->
                                <input v-model="rate.countries" class="form-input" placeholder="e.g., NG, GH, CI (use 2-letter codes)" />
                            </div>
                            <CurrencyInput v-model:input="rate.cost" label="Cost" />
                            <button @click="removeRate(index)" class="p-2 text-gray-400 hover:text-brand">
                                <Icon name="mdi:trash-can-outline" size="20" />
                            </button>
                        </div>
                    </div>
                    <button @click="addRate" class="text-sm font-semibold text-brand hover:underline">+ Add Rate</button>
                </div>
            </div>

            <div class="p-4 border-t bg-gray-50 flex justify-end gap-3">
                <button @click="$emit('close')" class="px-4 py-2 border rounded-lg text-sm font-semibold">Cancel</button>
                <button @click="$emit('save', zone)" class="px-4 py-2 bg-brand text-white rounded-lg text-sm font-semibold">Save Profile</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import TextInput from '~/components/shared/TextInput.vue';
import CurrencyInput from '~/components/shared/CurrencyInput.vue';

const props = defineProps<{ zone: any | null }>();
const emit = defineEmits(['close', 'save']);

const isEditing = computed(() => !!props.zone);

const zone = ref({
    id: props.zone?.id || undefined,
    name: props.zone?.name || '',
    rates: props.zone?.rates?.length ? props.zone.rates.map((r:any) => ({...r})) : [{ countries: [], cost: 0 }]
});

const addRate = () => {
    zone.value.rates.push({ countries: [], cost: 0 });
};

const removeRate = (index: number) => {
    if (zone.value.rates.length > 1) {
        zone.value.rates.splice(index, 1);
    }
};
</script>

<style scoped>
.form-input {
  @apply mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#f02c56] focus:border-transparent transition-colors;
}
</style>
