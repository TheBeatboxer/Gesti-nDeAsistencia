<template>
  <header class="bg-blue-600 text-white p-4 flex justify-between items-center">
    <div class="flex items-center">
      <h1 class="text-xl font-bold">Sistema de Asistencia</h1>
    </div>
    <div class="flex items-center space-x-4">
      <span class="text-sm">Bienvenido, {{ userName }}</span>
      <button @click="goHome" class="px-3 py-1 bg-blue-500 rounded hover:bg-blue-700">Inicio</button>
      <button class="px-3 py-1 bg-yellow-500 rounded hover:bg-yellow-700 relative">
        Notificaciones
        <span v-if="notificationCount > 0" class="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full px-1">{{ notificationCount }}</span>
      </button>
      <button @click="logout" class="px-3 py-1 bg-red-500 rounded hover:bg-red-700">Salir</button>
    </div>
  </header>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

export default {
  setup() {
    const userName = ref('');
    const notificationCount = ref(0); // Placeholder, can be fetched from API later
    const router = useRouter();

    onMounted(() => {
      userName.value = localStorage.getItem('userName') || 'Usuario';
      // Fetch notifications if needed
    });

    function goHome() {
      const role = localStorage.getItem('role');
      if (role === 'ADMIN') router.push('/admin');
      else if (role === 'ENCARGADO') router.push('/encargado');
      else if (role === 'WORKER') router.push('/worker');
      else router.push('/');
    }

    function logout() {
      localStorage.clear();
      location.reload();
    }

    return { userName, notificationCount, goHome, logout };
  }
};
</script>
