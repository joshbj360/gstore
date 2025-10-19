<template>
    <div class="min-h-screen bg-gray-50 animate-pulse">
        <!-- Header Skeleton -->
        <div class="text-center py-8 mb-8 bg-white shadow-sm">
            <div class="h-8 w-1/3 bg-gray-300 rounded-md mx-auto mb-4"></div>
            <div class="h-4 w-1/2 bg-gray-200 rounded-md mx-auto mb-6"></div>
            <div class="flex flex-wrap justify-center gap-2">
                <div v-for="i in 5" :key="i" class="h-10 w-24 bg-gray-200 rounded-full"></div>
            </div>
        </div>

        <!-- Products Grid Skeleton -->
        <div class="container mx-auto px-4">
            <div class="h-8 w-1/4 bg-gray-300 rounded-md mb-4"></div>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <div v-for="n in 8" :key="n" class="h-72 bg-gray-200 rounded-lg"></div>
            </div>
        </div>
    </div>
</template>