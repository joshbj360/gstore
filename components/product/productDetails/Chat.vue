<template>
   <div class="pt-2" />

<div v-if="false" class="text-center mt-6 text-xl text-gray-500">
  No comments...
</div>

<div v-else class="flex items-center justify-between px-8 mt-4">
  <div class="flex items-center relative w-full">
    <NuxtLink to="/profile/1">
      <img class="absolute top-0 rounded-full lg:mx-0 mx-auto" width="40"
        src="https://picsum.photos/id/2/200/200">
    </NuxtLink>
    <div class="ml-14 pt-0.5 w-full">
      <div class="text-[18px] font-semibold flex items-center justify-between">
        joshbj360
        <Icon class="cursor-pointer" name="material-symbols:delete-outline-sharp" size="25" />
      </div>
      <div class="text-[15px] font-light">
        very clumsy dress
      </div>
    </div>
  </div>
</div>

<div class="mb-28" />
</template>

<script lang="ts" setup>

</script>
>