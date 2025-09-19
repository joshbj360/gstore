<template>
  <div class="flex items-center hover:bg-gray-100 p-2.5 rounded-lg transition-all duration-300 cursor-pointer">
    <div class="flex items-center w-full">
      <Icon :name="icon" :style="{ color: color }" :size="size" />
      <span
        :style="{ color: color }"
        class="lg:block hidden pl-3 font-semibold text-sm"
      >
        {{ text }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  icon: string;
  color: string;
  size: string;
  text: string;
}>();
</script>