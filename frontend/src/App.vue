<script setup>
import Header from './components/Header.vue';
import Toast from './components/Toast.vue';
</script>

<template>
  <div id="app">
    <Header v-if="$route.name !== 'Login'" />
    <!-- Keep login full-bleed so its gradient and centering work as intended -->
    <div v-if="$route.name === 'Login'">
      <router-view />
    </div>
    <!-- Other views stay constrained for readable layout on wide screens -->
    <main v-else class="w-full p-4 sm:p-6 lg:p-8">
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
