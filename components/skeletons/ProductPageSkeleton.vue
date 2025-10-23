<template>
    <!-- This is the main Product Detail Page (PDP) layout -->
    <div class="max-w-6xl mx-auto py-8 animate-pulse">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            <!-- Left Column: Media Carousel Skeleton -->
            <div class="w-full aspect-square bg-neutral-800 border border-neutral-700 rounded-xl"></div>

            <!-- Right Column: Product Details Skeleton -->
            <div class="space-y-6">
                <!-- Seller Info Block Skeleton -->
                <div class="flex items-center justify-between mb-6 p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                    <div class="flex items-center">
                        <div class="w-12 h-12 rounded-full bg-neutral-700"></div>
                        <div class="ml-4 space-y-2">
                            <div class="h-4 w-32 bg-neutral-700 rounded"></div>
                            <div class="h-3 w-24 bg-neutral-700 rounded"></div>
                        </div>
                    </div>
                    <div class="h-8 w-20 bg-neutral-700 rounded-md"></div>
                </div>

                <!-- Product Title & Price Skeleton -->
                <div class="space-y-3">
                    <div class="h-8 w-3/4 bg-neutral-700 rounded"></div>
                    <div class="h-10 w-1/3 bg-neutral-700 rounded"></div>
                </div>

                <!-- Shipping Info Skeleton -->
                <div class="h-16 w-full bg-neutral-800 rounded-lg"></div>

                <!-- Variant Selector Skeleton -->
                <div class="space-y-2">
                    <div class="h-4 w-1/4 bg-neutral-700 rounded"></div>
                    <div class="flex gap-2">
                        <div class="h-10 w-16 bg-neutral-800 rounded-lg"></div>
                        <div class="h-10 w-16 bg-neutral-800 rounded-lg"></div>
                        <div class="h-10 w-16 bg-neutral-800 rounded-lg"></div>
                    </div>
                </div>

                <!-- Action Button Skeleton -->
                <div class="grid grid-cols-3 gap-4">
                    <div class="col-span-1 h-12 bg-neutral-800 rounded-xl"></div>
                    <div class="col-span-1 h-12 bg-neutral-800 rounded-xl"></div>
                    <div class="col-span-1 h-12 bg-neutral-800 rounded-xl"></div>
                </div>

                <!-- Accordion Skeleton -->
                <div class="space-y-2 pt-4">
                    <div class="h-12 w-full bg-neutral-800 rounded-lg"></div>
                    <div class="h-12 w-full bg-neutral-800 rounded-lg"></div>
                </div>
            </div>
        </div>
    </div>
</template>
