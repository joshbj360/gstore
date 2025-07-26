<template>
  <div class="bg-white rounded-lg p-3 sm:p-4">
    <!-- Tabs Navigation -->
    <div class="flex border-b border-gray-200" role="tablist" aria-label="Product tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="setActiveTab(tab.id)"
        :class="{
          'border-b-2 border-[#f02c56] text-[#f02c56]': activeTab === tab.id,
          'text-gray-600 hover:text-[#f02c56] hover:bg-[#f02c56]/10': activeTab !== tab.id,
        }"
        class="px-3 sm:px-4 py-2 text-sm sm:text-base font-medium focus:outline-none focus:ring-2 focus:ring-[#f02c56]/50 transition-all duration-250"
        role="tab"
        :aria-selected="activeTab === tab.id"
        :aria-controls="`tab-panel-${tab.id}`"
        :id="`tab-${tab.id}`"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="mt-3 sm:mt-4">
      <div
        v-if="activeTab === 'details'"
        :id="'tab-panel-details'"
        role="tabpanel"
        aria-labelledby="tab-details"
        tabindex="0"
      >
        <slot name="details"></slot>
      </div>
      <div
        v-if="activeTab === 'similar'"
        :id="'tab-panel-similar'"
        role="tabpanel"
        :aria-labelledby="'tab-similar'"
        tabindex="0"
      >
        <slot name="similar"></slot>
      </div>
      <div
        v-if="activeTab === 'seller'"
        :id="'tab-panel-seller'"
        role="tabpanel"
        aria-labelledby="tab-seller"
        tabindex="0"
      >
        <slot name="seller"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

type TabID = 'details' | 'similar' | 'seller';
interface Tab {
  id: TabID;
  label: string;
}

const props = defineProps<{
  activeTab?: TabID;
}>();

const emit = defineEmits<{
  (e: 'update:activeTab', tabId: TabID): void;
}>();

const tabs: Tab[] = [
  { id: 'details', label: 'Details' },
  { id: 'similar', label: 'Similar Products' },
  { id: 'seller', label: 'More from Seller' },
];

const activeTab = ref<TabID>(props.activeTab || 'details');

const setActiveTab = (tabId: TabID) => {
  activeTab.value = tabId;
  emit('update:activeTab', tabId);
};

defineExpose({
  activeTab,
  setActiveTab,
});
</script>