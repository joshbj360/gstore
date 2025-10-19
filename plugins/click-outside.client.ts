export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('click-outside', {
    beforeMount(el, binding) {
      // This is the core logic. It checks if the click was outside the element.
      el.clickOutsideEvent = (event: MouseEvent) => {
        // If the clicked element is not the element with the directive
        // or a child of that element, then call the provided method.
        if (!(el === event.target || el.contains(event.target))) {
          binding.value(event); // Call the method passed to the directive
        }
      };
      // Add the event listener to the whole document
      document.addEventListener('click', el.clickOutsideEvent);
    },
    unmounted(el) {
      // Clean up by removing the event listener when the component is destroyed
      document.removeEventListener('click', el.clickOutsideEvent);
    },
  });
});