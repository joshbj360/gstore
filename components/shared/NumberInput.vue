<template>
  <div class="space-y-1">
    <label v-if="label" class="block text-sm font-medium text-gray-700">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <div class="relative rounded-md shadow-sm">
      <input
        :type="inputType"
        :value="input"
        @input="handleInput"
        :placeholder="placeholder"
        :class="[
          'block w-full rounded-md border py-2 px-3 focus:outline-none sm:text-sm',
          error ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-300 placeholder-gray-400 focus:border-[#C42B78] focus:ring-[#C42B78]'
        ]"
      />
    </div>
    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  input: {
    type: [Number, String],
    default: ''
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
  inputType: {
    type: String,
    default: 'number'
  }
});

const emit = defineEmits(['update:input']);

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  let value: number | string = target.value;
  
  if (props.inputType === 'number') {
    value = value === '' ? '' : Number(value);
    if (isNaN(value as number)) value = '';
  }
  
  emit('update:input', value);
};
</script>