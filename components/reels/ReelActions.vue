<template>
    <div class="flex flex-col gap-4">
        <button @click="likeStore.toggleProductLike(product.id)" class="action-button">
            <Icon name="mdi:heart" size="28" :class="isLiked ? 'text-brand' : 'text-white'" />
            <span class="text-xs">{{ product._count?.likes || 0 }}</span>
        </button>
         <button @click="$emit('open-comments')" class="action-button">
            <Icon name="mdi:comment-text-outline" size="28" />
            <span class="text-xs">{{ product._count?.comments || 0 }}</span>
        </button>
        <button @click="shareReel" class="action-button">
            <Icon name="mdi:share-variant" size="28" />
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLikeStore } from '~/stores';
const props = defineProps(['product']);
const likeStore = useLikeStore();
const isLiked = computed(() => likeStore.likedProductIds.has(props.product.id));

const shareReel = () => {
  if (navigator.share) {
    navigator.share({ title: props.product.title, url: `${window.location.origin}/product/${props.product.slug}` });
  }
};
</script>

<style scoped>
/* THE FIX: Changed text color to white */
.action-button { 
  @apply flex flex-col items-center text-white font-semibold; 
}
</style>