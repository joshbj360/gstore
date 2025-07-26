 <template>
 <!-- Swipe Hint Overlay -->
 <transition name="fade">
    <div 
      class="absolute inset-0 flex items-center justify-center bg-black/50 z-10 pointer-events-none"
      
    >
      <div class="text-white text-center p-6">
        <div class="mb-8">
          <Icon name="mdi:gesture-swipe-right" size="48" class="mx-auto" />
          <p>Swipe right for details</p>
        </div>
        <div class="flex justify-center gap-12">
          <div>
            <Icon name="mdi:gesture-swipe-up" size="48" />
            <p>Previous product</p>
          </div>
          <div>
            <Icon name="mdi:gesture-swipe-down" size="48" />
            <p>Next product</p>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>
