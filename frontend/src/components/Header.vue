<template>
  <header class="bg-blue-600 text-white p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
    <div class="flex items-center justify-between w-full sm:w-auto">
      <h1 class="text-lg sm:text-xl font-bold">Sistema de Asistencia</h1>
      <button class="sm:hidden px-2 py-1 bg-blue-500 rounded text-sm">Menu</button>
    </div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:space-x-4 w-full sm:w-auto gap-2">
      <span class="text-sm">Bienvenido, {{ userName }}</span>
      <div class="flex flex-col sm:flex-row sm:space-x-2 w-full sm:w-auto">
        <button @click="goHome" class="w-full sm:w-auto px-3 py-1 bg-blue-500 rounded hover:bg-blue-700 text-sm">Inicio</button>
        <button class="w-full sm:w-auto mt-1 sm:mt-0 px-3 py-1 bg-yellow-500 rounded hover:bg-yellow-700 relative text-sm">
          Notificaciones
          <span v-if="notificationCount > 0" class="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full px-1">{{ notificationCount }}</span>
        </button>
        <button @click="logout" class="w-full sm:w-auto mt-1 sm:mt-0 px-3 py-1 bg-red-500 rounded hover:bg-red-700 text-sm">Salir</button>
      </div>
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
      // Redirect to login page instead of full reload
      router.push('/');
    }

    return { userName, notificationCount, goHome, logout };
  }
};
</script>
