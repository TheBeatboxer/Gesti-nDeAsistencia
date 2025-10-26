<template>
  <div v-if="show" class="fixed top-4 right-4 z-50">
    <div :class="toastClass" class="px-4 py-2 rounded shadow-lg text-white max-w-sm">
      {{ message }}
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  setup() {
    const show = ref(false);
    const message = ref('');
    const type = ref('success'); // success, error, info

    const toastClass = ref('bg-green-500');

    const showToast = (msg, toastType = 'success') => {
      message.value = msg;
      type.value = toastType;
      toastClass.value = toastType === 'success' ? 'bg-green-500' : toastType === 'error' ? 'bg-red-500' : 'bg-blue-500';
      show.value = true;
      setTimeout(() => {
        show.value = false;
      }, 3000); // Hide after 3 seconds
    };

    // Expose showToast globally
    window.showToast = showToast;

    return {
      show,
      message,
      toastClass,
      showToast
    };
  }
};
</script>
