<template>
    <div class="min-h-screen bg-gray-100 flex flex-col">
        <AppHeader />
        <!-- Main 3-Column Layout Container -->
        <div class="flex flex-1 overflow-hidden">
            <!-- 
              SLOT 1: Left Sidebar
              Pages can provide content for this sidebar.
            -->
            <aside class="hidden md:block w-72 bg-white p-4 h-[calc(100vh-56px)] overflow-y-auto border-r">
                <slot name="left-sidebar" />
            </aside>

            <!-- 
              SLOT 2: Main Content (Default Slot)
              This is where the primary page content will go.
            -->
            <main class="flex-1 overflow-y-auto px-4 py-6">
                <slot />
            </main>

            <!-- 
              SLOT 3: Right Sidebar
              Pages can provide content for this sidebar.
            -->
            <aside class="hidden lg:block w-72 bg-white p-4 h-[calc(100vh-56px)] overflow-y-auto border-l">
                <slot name="right-sidebar" />
            </aside>
        </div>
    </div>
</template>

<script setup lang="ts">
import AppHeader from './children/AppHeader.vue';
</script>

