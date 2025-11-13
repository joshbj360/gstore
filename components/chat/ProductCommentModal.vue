<template>
  <transition
    enter-active-class="transition-opacity duration-300 ease-out"
    leave-active-class="transition-opacity duration-300 ease-in"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      @click="closeModal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="comment-modal-title"
    >
      <div
        class="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 h-[80vh] flex flex-col"
        @click.stop
      >
        <ElProductComments v-if="product" :product="product" /> 

        <div v-else class="flex-1 flex items-center justify-center text-gray-500">
            <p>Could not load comment section.</p>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import ElProductComments from '~/components/chat/ElProductComment.vue';
import type { IProduct } from '~/models';

// The modal now accepts the full product object, which is required by the ProductComments component. [cite: 120-121]
const props = defineProps<{
  isOpen: boolean;
  product: IProduct | null;
}>();

const emit = defineEmits(["close"]);

const closeModal = () => {
  emit("close");
};
</script>