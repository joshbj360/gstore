<template>
  <div class="space-y-1">
    <label v-if="label" class="block text-sm font-medium text-gray-700">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <div class="relative rounded-md shadow-sm">
      <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <span class="text-gray-500 sm:text-sm">₦</span>
      </div>
      <input
        type="text"
        :value="formattedValue"
        @input="handleInput"
        @blur="handleBlur"
        :placeholder="placeholder"
        :class="[
          'block w-full rounded-md border py-2 pl-7 pr-3 focus:outline-none sm:text-sm',
          error ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-300 placeholder-gray-400 focus:border-[#C42B78] focus:ring-[#C42B78]'
        ]"
      />
    </div>
    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
    <p v-if="showNairaValue" class="mt-1 text-xs text-gray-500">
      {{ formatForDisplay(input) }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps({
  input: {
    type: Number,
    default: 0
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  error: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  showNairaValue: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:input']);

// Track raw input for better handling during editing
const rawInput = ref('');

// Format the value for display in the input
const formattedValue = computed(() => {
  if (rawInput.value !== '') {
    return rawInput.value;
  }
  return props.input === 0 ? '' : (props.input / 100).toFixed(2);
});

// Format for display below the input
const formatForDisplay = (cents: number) => {
  return `₦${(cents / 100).toFixed(2)}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  // Store raw input during editing
  rawInput.value = target.value;
  
  // Try to parse the value
  const cleanedValue = target.value.replace(/[^0-9.]/g, '');
  const nairaValue = parseFloat(cleanedValue) || 0;
  const centsValue = Math.round(nairaValue * 100);
  emit('update:input', centsValue);
};

const handleBlur = () => {
  // Format properly on blur
  rawInput.value = props.input === 0 ? '' : (props.input / 100).toFixed(2);
};
</script>