<template>
  <div>
    <client-only>
      <!-- <label class="text-semibold text-[13px] text-gray-400">{{ placeholder }}</label> -->
    <label class="block text-sm font-medium text-gray-700">{{ label }}</label>

        <div id="tag-input-container" class="flex flex-wrap items-center border p-1 rounded-md w-80">
          <!-- Render tags -->
            <div id="tags" class="flex flex-wrap gap-1">
              <div
                v-for="(tag, index) in modelValue"
                  :key="index"
                  class="tag bg-gray-200 px-2 py-1 rounded flex items-center gap-1"
                >
                  <span>{{ tag }}</span>
                  <span class="close cursor-pointer" @click="removeTag(index)">×</span>
              </div>
            </div>

            <!-- Input for adding tags -->
            <input
              v-model="inputValue"
              type="text"
              id="tag-input"
              class="flex p-[5px] outline-none"
              :placeholder="placeholder"
              @focus="isFocused = true"
              @blur="isFocused = false"
              @keydown.tab.prevent="addTag" 
              @keydown.enter.prevent="addTag" 
            />
          </div>
    </client-only>
        <!-- <span v-if="error" class="text-red-500 text-[14px] font-semibold">
            {{ error }}
        </span> -->
  </div>
</template>

<script lang="ts" setup>
import  { type ITag, defaultTag } from '~/models';


const inputValue = ref<string>(''); // Local state for the input value
const props = defineProps({
  modelValue: {
    type: Array as () => string[],
    default: () => [],
  },
  label: {
    type: String,
    default: 'Add tags...',
  },
  placeholder: {
    type: String,
    default: 'Add tags...',
  },
})
let isFocused = ref(false)

const emit = defineEmits<{
  (e: 'update:modelValue', newTags: string[]): void;
}>();

// Add a new tag
const addTag = () => {
  if (inputValue.value.trim() && !props.modelValue.includes(inputValue.value.trim())) {
    const newTags = [...props.modelValue, inputValue.value];
    emit('update:modelValue', newTags); // Emit the updated tags to the parent component
    inputValue.value = ''; // Clear the input field
  }
};

// Remove a tag by index
const removeTag = (index: number) => {
  const newTags = props.modelValue.filter((_, i) => i !== index);
  emit('update:modelValue', newTags); // Emit the updated tags to the parent component
};
</script>

<style scoped>
.tag {
  background-color: #e0e0e0;
  padding: 5px 10px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.close {
  cursor: pointer;
  color: #888;
  font-size: 14px;
}

.close:hover {
  color: #333;
}
</style>
