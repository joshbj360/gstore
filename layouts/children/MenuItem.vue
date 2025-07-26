<template>
  <div class="flex items-center hover:bg-gray-100 p-2 rounded-md transition-all duration-300">
    <div class="flex items-center">
      <Icon :name="icon" :color="colorString" :size="sizeString" />
      <span
        :class="`text-[${colorString}]`"
        class="lg:block hidden pl-2 font-semibold text-sm"
      >
        {{ iconString }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, toRefs } from 'vue';

const props = defineProps<{
  colorString: string;
  sizeString: string;
  iconString: string;
}>();

const { colorString, sizeString, iconString } = toRefs(props);

const icon = ref('');

if (iconString.value === 'Home') icon.value = 'mdi:home';
if (iconString.value === 'Trending') icon.value = 'mdi:fire';
if (iconString.value === 'Grandeur Collections') icon.value = 'mdi:store';
if (iconString.value === 'Following') icon.value = 'ri:group-3-fill';
if (iconString.value === 'Live shopping') icon.value = 'ri:live-fill';
</script>
```
