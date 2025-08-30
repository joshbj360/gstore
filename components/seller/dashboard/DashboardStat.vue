<template>
  <div class="bg-white rounded-lg shadow-sm p-4 sm:p-5 border border-gray-100 hover:shadow-md transition-all duration-200">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">{{ title }}</p>
        <p class="text-2xl sm:text-3xl font-bold text-gray-800 mt-1">{{ value }}</p>
      </div>
      <div 
        class="p-3 rounded-full"
        :class="{
          'bg-brand/10': trend === 'up',
          'bg-yellow-100': trend === 'down',
          'bg-gray-100': trend === 'neutral'
        }"
      >
        <Icon 
          :name="icon" 
          size="20" 
          :class="{
            'text-brand-dark': trend === 'up',
            'text-yellow-500': trend === 'down',
            'text-gray-500': trend === 'neutral'
          }" 
        />
      </div>
    </div>
    
    <div 
      v-if="change !== 0" 
      class="flex items-center mt-3 text-xs sm:text-sm"
      :class="{
        'text-[#009A66]': trend === 'up',
        'text-yellow-600': trend === 'down'
      }"
    >
      <Icon 
        :name="trend === 'up' ? 'mdi:arrow-up' : 'mdi:arrow-down'" 
        size="16" 
        class="mr-1" 
      />
      <span>{{ Math.abs(change) }}% {{ trend === 'up' ? 'increase' : 'decrease' }}</span>
      <span class="text-gray-400 ml-1">vs last period</span>
    </div>
    <div v-else class="mt-3 text-xs sm:text-sm text-gray-400">No change vs last period</div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  trend: {
    type: String as () => 'up' | 'down' | 'neutral',
    default: 'neutral'
  },
  change: {
    type: Number,
    default: 0
  }
});
</script>

<style scoped>
/* Smooth transition for hover effects */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
</style>