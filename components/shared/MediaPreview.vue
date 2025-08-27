<template>
  <div class="mb-6">
    <!-- Header -->
    <div class="mb-4">
      <h3 class="text-lg font-semibold text-gray-800">
        {{ title }} <span class="text-gray-500">({{ media.length }} uploaded)</span>
      </h3>
      <p v-if="description" class="text-sm text-gray-500 mt-1">{{ description }}</p>
    </div>

    <!-- Media Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
      <div
        v-for="(item, index) in media"
        :key="index"
        class="relative group h-48 rounded-lg overflow-hidden border border-gray-200 hover:border-[#C42B78] transition-colors"
        :class="{ 'ring-2 ring-[#C42B78]': index === mainMediaIndex }"
      >
        <!-- Image Preview -->
        <img
          v-if="item.type === 'IMAGE'"
          :src="item.url"
          class="w-full h-full object-cover cursor-pointer"
          @click="setMainMedia(index)"
          :alt="`Product image ${index + 1}`"
        />

        <!-- Video Preview -->
        <video
          v-else-if="item.type === 'VIDEO'"
          autoplay
          loop
          muted
          class="w-full h-full object-cover cursor-pointer"
          :src="item.url"
          @click="setMainMedia(index)"
        />

        <!-- Fallback for other types -->
        <div
          v-else
          class="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400"
        >
          <Icon name="mdi:file-outline" size="24" />
        </div>

        <!-- Media Actions -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
          <div class="flex justify-between w-full">
            <button
              v-if="index !== mainMediaIndex"
              @click.stop="setMainMedia(index)"
              class="text-white hover:text-[#C42B78] transition-colors"
              aria-label="Set as main media"
            >
              <Icon name="mdi:star-outline" size="20" />
            </button>
            <span v-else class="text-[#C42B78]">
              <Icon name="mdi:star" size="20" />
            </span>

            <button
              @click.stop="removeMedia(index)"
              class="text-white hover:text-red-400 transition-colors"
              aria-label="Remove media"
            >
              <Icon name="mdi:trash-can-outline" size="20" />
            </button>
          </div>
        </div>

        <!-- Caption Input -->
        <input
          v-if="editableCaptions"
          v-model="item.caption"
          @change="updateCaption(index, $event)"
          type="text"
          placeholder="Add caption"
          class="absolute bottom-0 left-0 right-0 bg-white/90 p-2 text-sm focus:outline-none"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MediaInterface } from '~/models/interface/products/media.interface';

interface Props {
  media: MediaInterface[];
  title?: string;
  description?: string;
  mainMediaIndex?: number;
  editableCaptions?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Media Preview',
  description: '',
  mainMediaIndex: 0,
  editableCaptions: true
});

const emit = defineEmits<{
  (e: 'remove', index: number): void;
  (e: 'set-main', index: number): void;
  (e: 'update-caption', payload: { index: number; caption: string }): void;
}>();

const removeMedia = (index: number) => {
  emit('remove', index);
};

const setMainMedia = (index: number) => {
  emit('set-main', index);
};

const updateCaption = (index: number, event: Event) => {
  const caption = (event.target as HTMLInputElement).value;
  emit('update-caption', { index, caption });
};
</script>