<template>
  <div class="w-full rounded-lg overflow-hidden shadow-md mb-4 sm:mb-6">
    <Carousel :items-to-show="1" :wrap-around="true" :autoplay="5000" :pause-autoplay-on-hover="true">
      <Slide v-for="ad in advertisements" :key="ad.id">
        <div class="carousel__item relative w-full h-48 md:h-64 bg-gray-200">
          <img :src="ad.imageUrl" :alt="ad.alt" class="w-full h-full object-cover">
          <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          <div class="absolute bottom-0 left-0 p-4 md:p-6 text-white text-left">
            <h2 class="text-lg md:text-2xl font-bold">{{ ad.title }}</h2>
            <p class="text-xs md:text-sm">{{ ad.subtitle }}</p>
          </div>
        </div>
      </Slide>

      <template #addons>
        <Pagination />
      </template>
    </Carousel>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import 'vue3-carousel/dist/carousel.css';

const advertisements = ref([
  { id: 1, title: 'Summer Collection is Here', subtitle: 'Discover the latest trends', imageUrl: 'https://picsum.photos/id/1015/1200/400', alt: 'Woman in summer dress' },
  { id: 2, title: 'Flash Sale: 50% Off', subtitle: 'Limited time offer on all shoes', imageUrl: 'https://picsum.photos/id/103/1200/400', alt: 'Collection of shoes' },
  { id: 3, title: 'New Arrivals Daily', subtitle: 'Shop the freshest looks', imageUrl: 'https://picsum.photos/id/1016/1200/400', alt: 'Woman posing in new outfit' },
]);
</script>

<style scoped>
.carousel__pagination {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
}
.carousel__pagination-button::after {
  background-color: white;
  opacity: 0.5;
  border-radius: 9999px;
  width: 8px;
  height: 8px;
}
.carousel__pagination-button--active::after {
  opacity: 1;
}
</style>