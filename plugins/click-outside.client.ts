/**
 * This plugin defines the global `v-click-outside` directive.
 * The `.client.ts` suffix is crucial. It tells Nuxt to
 * only run this code in the browser, not on the server.
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('click-outside', {
    beforeMount(el, binding) {
      el.clickOutsideEvent = (event: MouseEvent) => {
        // Check that the click was outside the element
        if (!(el === event.target || el.contains(event.target as Node))) {
          binding.value(event); // Call the method passed to the directive
        }
      };
      document.addEventListener('click', el.clickOutsideEvent);
    },
    unmounted(el) {
      // Clean up the event listener
      document.removeEventListener('click', el.clickOutsideEvent);
    },
  });
});
