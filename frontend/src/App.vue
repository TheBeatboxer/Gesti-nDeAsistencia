<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Header from './components/Header.vue';
import Toast from './components/Toast.vue';

const router = useRouter();

onMounted(() => {
  const token = localStorage.getItem('token');
  if (token) {
    // Redirect based on role stored in localStorage
    const role = localStorage.getItem('role');
    if (role === 'ADMIN') router.push('/admin');
    else if (role === 'ENCARGADO') router.push('/encargado');
    else router.push('/worker');
  }
});
</script>

<template>
  <div id="app">
    <Header v-if="$route.name !== 'Login'" />
    <!-- Keep login full-bleed so its gradient and centering work as intended -->
    <div v-if="$route.name === 'Login'">
      <router-view />
    </div>
    <!-- Other views stay constrained for readable layout on wide screens -->
    <main v-else class="max-w-screen-md mx-auto p-4 sm:p-6">
      <router-view />
    </main>
    <Toast />
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
}
</style>
