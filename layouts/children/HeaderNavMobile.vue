<template>
    <!-- 
      This is a simple, theme-compliant header.
      It defaults to light mode and uses dark: prefixes.
    -->
    <header class="md:hidden sticky top-0 z-10 bg-white dark:bg-neutral-950 shadow-sm border-b border-gray-200 dark:border-neutral-800">
        <nav class="h-14 px-4 flex items-center justify-between gap-4 max-w-7xl mx-auto">
            
            <!-- Logo: Home Anchor -->
            <NuxtLink to="/" class="flex items-center space-x-2 shrink-0">
                <div class="w-10 h-10 bg-brand rounded-full flex items-center justify-center hover:scale-105 transition-transform">
                    <Icon name="mdi:store-fashion" class="w-6 h-6 text-white" />
                </div>
                <span class="sm:inline text-lg font-bold text-gray-800 dark:text-neutral-100 tracking-wider">{{ config.public.siteName }}</span>
            </NuxtLink>

            <!-- 
              This is a minimal header, so the main navigation and user profile
              are intentionally left out. You can add a close button here
              if it's being used in a modal context.
            -->
            
            <!-- Example: Close button if used in a modal page -->
            <!--
            <NuxtLink to="/" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800">
                <Icon name="mdi:close" size="24" class="text-gray-600 dark:text-neutral-300" />
            </NuxtLink>
            -->
        </nav>
    </header>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();
// This component has no complex logic, keeping it simple as requested.
</script>
