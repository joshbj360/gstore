<template>
  <transition
    enter-active-class="transition-opacity duration-300 ease-out"
    leave-active-class="transition-opacity duration-300 ease-in"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      @click="closeModal"
    >
      <div
        class="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4"
        @click.stop
      >
        <div
          class="flex items-center justify-between p-4 border-b border-gray-200"
        >
          <h3 class="text-lg font-semibold text-gray-800">
            Reviews & Comments
          </h3>
          <button
            @click="closeModal"
            class="text-gray-500 hover:text-gray-700"
          >
            <Icon name="mdi:close" size="24" />
          </button>
        </div>

        <div class="p-6 h-96 overflow-y-auto space-y-4">
          <div
            v-if="!comments.length"
            class="text-center text-gray-500 pt-16"
          >
            <p>No comments yet. Be the first to leave a review!</p>
          </div>

          <div
            v-for="comment in comments"
            :key="comment.id"
            class="flex items-start gap-3"
          >
            <img
              :src="comment.avatar"
              alt="User avatar"
              class="w-10 h-10 rounded-full"
            />
            <div class="bg-gray-100 rounded-lg p-3 flex-1">
              <p class="font-semibold text-sm">{{ comment.author }}</p>
              <p class="text-gray-700">{{ comment.text }}</p>
            </div>
          </div>
        </div>

        <div class="p-4 border-t border-gray-200">
          <form @submit.prevent="submitComment" class="flex items-center gap-2">
            <input
              v-model="newComment"
              type="text"
              placeholder="Write a comment..."
              class="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f02c56]"
            />
            <button
              type="submit"
              class="p-2 bg-[#f02c56] text-white rounded-lg hover:bg-[#df4949]"
            >
              <Icon name="mdi:send" size="24" />
            </button>
          </form>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits(["close"]);

const comments = ref([
  {
    id: 1,
    author: "Jane Doe",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
    text: "This is a great product! I highly recommend it.",
  },
  {
    id: 2,
    author: "John Smith",
    avatar: "https://i.pravatar.cc/150?u=a04258114e29026702d",
    text: "I love the quality and the design. Will definitely buy again.",
  },
]);

const newComment = ref("");

const closeModal = () => {
  emit("close");
};

const submitComment = () => {
  if (newComment.value.trim()) {
    comments.value.push({
      id: Date.now(),
      author: "You",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704e",
      text: newComment.value,
    });
    newComment.value = "";
  }
};
</script>