<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-700">
    <div class="bg-white rounded-xl shadow p-8 w-full max-w-md">
      <h2 class="text-2xl font-bold mb-4">Iniciar sesión</h2>
      <form @submit.prevent="login">
        <label class="block mb-2">Email</label>
        <input v-model="email" class="w-full p-2 border rounded mb-4" />
        <label class="block mb-2">Password</label>
        <input type="password" v-model="password" class="w-full p-2 border rounded mb-4" />
        <button class="w-full bg-blue-600 text-white p-2 rounded">Entrar</button>
      </form>
      <p v-if="error" class="text-red-500 mt-3">{{ error }}</p>
    </div>
  </div>
</template>

<script>
import api from '../api';
import router from '../router';
import { ref } from 'vue';
export default {
  setup() {
    const email = ref('');
    const password = ref('');
    const error = ref('');
    async function login(){
      try{
        // Clear any existing session data before login and trigger storage event
        localStorage.clear();
        // Trigger storage event to notify other tabs of session change
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'token',
          oldValue: 'some_value',
          newValue: null
        }));

        const res = await api.post('/auth/login', { email: email.value, password: password.value });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userId', res.data.user.id); // Store userId
        localStorage.setItem('role', res.data.user.role); // Store role
        localStorage.setItem('userName', res.data.user.name); // Store userName
        localStorage.setItem('turno', res.data.user.turno); // Store turno

        // Trigger storage event to notify other tabs of new session
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'token',
          oldValue: null,
          newValue: res.data.token
        }));
        // Router will handle navigation automatically via navigation guards
        const role = res.data.user.role;
        if(role === 'ADMIN') router.push('/admin');
        else if(role === 'ENCARGADO') router.push('/encargado');
        else router.push('/worker');
      } catch(err) {
        error.value = err.response?.data?.msg || 'Login failed';
      }
    }
    return { email, password, login, error };
  }
};
</script>
