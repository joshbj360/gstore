<template>
  <button
    @click="toggleTheme"
    class="p-2 rounded-full text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100 transition-colors"
    aria-label="Toggle theme"
  >
    <Icon v-if="colorMode.value === 'dark'" name="mdi:weather-sunny" size="22" />
    <Icon v-else name="mdi:weather-night" size="22" />
  </button>
</template>

<script setup lang="ts">
const colorMode = useColorMode();

const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
};
</script>
