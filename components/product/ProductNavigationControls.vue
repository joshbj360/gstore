<template>
  <!-- Mobile Navigation -->
  <div class="lg:hidden fixed bottom-4 left-0 right-0 flex justify-center gap-3 z-50">
    <button
      @click.stop="$emit('show-previous')"
      class="bg-white/90 p-2 rounded-full shadow-md hover:bg-[#C42B78] hover:text-white transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-[#C42B78]/50"
      aria-label="Show previous product"
    >
      <Icon name="mdi:chevron-up" size="16" />
    </button>
    <button
      @click.stop="$emit('toggle-view')"
      class="bg-white/90 p-2 rounded-full shadow-md hover:bg-[#C42B78] hover:text-white transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-[#C42B78]/50"
      :aria-label="props.activeView === 'product' ? 'Show product details' : 'Show product media'"
    >
      <Icon :name="props.activeView === 'product' ? 'mdi:information-outline' : 'mdi:image'" size="16" />
    </button>
    <button
      @click.stop="$emit('show-next')"
      class="bg-white/90 p-2 rounded-full shadow-md hover:bg-[#C42B78] hover:text-white transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-[#C42B78]/50"
      aria-label="Show next product"
    >
      <Icon name="mdi:chevron-down" size="16" />
    </button>
  </div>

  <!-- Desktop Navigation -->
  <div class="hidden lg:flex flex-col fixed right-[600px]  top-1/2 transform -translate-y-1/2 z-50 gap-2">
    <button
      @click.stop="$emit('show-previous')"
      class="bg-white/90 p-2 rounded-full shadow-md hover:bg-[#C42B78] hover:text-white transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-[#C42B78]/50"
      aria-label="Show previous product"
    >
      <Icon name="mdi:chevron-up" size="16" />
    </button>
    <button
      @click.stop="$emit('show-next')"
      class="bg-white/90 p-2 rounded-full shadow-md hover:bg-[#C42B78] hover:text-white transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-[#C42B78]/50"
      aria-label="Show next product"
    >
      <Icon name="mdi:chevron-down" size="16" />
    </button>

    
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  activeView: 'product' | 'details';
}>();

defineEmits(['show-previous', 'show-next', 'toggle-view']);
</script>