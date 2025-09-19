<template>
  <MainLayout>
    <!-- The ProductLayout component contains the grid of products -->
    <!-- It will automatically fill the main content area of the MainLayout -->
    <ProductLayout />
  </MainLayout>
</template>

<script lang="ts" setup>
import MainLayout from '@/layouts/MainLayout.vue';
import ProductLayout from '@/layouts/ProductLayout.vue';

// No page-specific script is needed here, keeping the component clean.
</script>