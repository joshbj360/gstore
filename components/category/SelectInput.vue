<template>
  <div class="space-y-1">
    <label class="block text-sm font-medium text-gray-700 dark:text-neutral-300">{{ label }}</label>
    <div class="flex space-x-2">
      <select
        v-model="selectedCategory"
        class="
          w-full 
          bg-white dark:bg-neutral-800
          text-gray-800 dark:text-neutral-100
          border
          text-sm
          rounded-lg
          p-3
          placeholder-gray-500
          focus:outline-none
          focus:ring-2
        "
        :class="[
          error 
            ? 'border-red-500 focus:ring-red-500' 
            : 'border-gray-300 dark:border-neutral-700 focus:ring-brand'
        ]"
        autocomplete="on"
      >
        <option :value="selectedCategory" disabled>{{ placeholder }}</option>
        <option v-for="category in categories" :key="category.id" :value="category.name">
          {{ category.name }}
        </option>
      </select>
      <button
        type="button"
        class="bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-700 transition"
        @click="addCategory"
      >
        <Icon name="mdi:plus" class="cursor-pointer" size="20" />
      </button>
    </div>
    <span v-if="error" class="text-brand dark:text-brand-light text-sm font-semibold">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, toRefs } from 'vue';
import type { ICategory } from '~/models'

const emit = defineEmits<{
  (e: 'update:input', value: string): void;
  (e: 'open-dialog'): void;
}>();

const props = defineProps<{
  input: string | undefined
  placeholder?: string;
  max?: number;
  inputType?: string;
  error?: string;
  categories: ICategory[];
  label: string;
}>();

const { input, placeholder, error, label } = toRefs(props);

const selectedCategory = computed({
  get: () => input.value ?? '',
  set: (val) => emit('update:input', val),
});

const addCategory = () => {
  emit('open-dialog');
};
</script>