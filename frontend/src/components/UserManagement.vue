<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <h1 class="text-2xl lg:text-3xl font-bold mb-4">Gestión de Usuarios</h1>
    <div class="mb-4">
      <button @click="showCreateForm = true" class="px-4 py-2 bg-green-600 text-white rounded mr-2">Crear Usuario</button>
    </div>

    <div v-if="showCreateForm" class="bg-white p-4 rounded shadow mb-4">
      <h3 class="font-semibold mb-2">Crear Nuevo Usuario</h3>
      <form @submit.prevent="createUser">
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <input v-model="newUser.name" placeholder="Nombre" class="border p-2 rounded" required />
          <input v-model="newUser.email" type="email" placeholder="Email" class="border p-2 rounded" required />
          <input v-model="newUser.password" type="password" placeholder="Contraseña" class="border p-2 rounded" required />
          <select v-model="newUser.role" class="border p-2 rounded" required>
            <option value="">Seleccionar Rol</option>
            <option value="ADMIN">Admin</option>
            <option value="ENCARGADO">Encargado</option>
            <option value="WORKER">Trabajador</option>
          </select>
          <select v-model="newUser.area" class="border p-2 rounded" v-if="newUser.role !== 'ADMIN'">
            <option value="">Seleccionar Área</option>
            <option value="Manufactura">Manufactura</option>
            <option value="Envasado">Envasado</option>
            <option value="Soporte">Soporte</option>
          </select>
          <select v-model="newUser.turno" class="border p-2 rounded" v-if="newUser.role !== 'ADMIN'">
            <option value="">Seleccionar Turno</option>
            <option value="dia">Día</option>
            <option value="noche">Noche</option>
          </select>
          <input v-model="newUser.linea" placeholder="Línea" class="border p-2 rounded" v-if="newUser.role !== 'ADMIN'" />
          <input v-model="newUser.puesto" placeholder="Puesto" class="border p-2 rounded" v-if="newUser.role !== 'ADMIN'" />
          <input v-model="newUser.codigo" placeholder="Código" class="border p-2 rounded" v-if="newUser.role !== 'ADMIN'" />
        </div>
        <div class="mt-4 flex flex-col sm:flex-row gap-2">
          <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded">Crear</button>
          <button @click="showCreateForm = false" class="px-4 py-2 bg-gray-600 text-white rounded">Cancelar</button>
        </div>
      </form>
    </div>

    <div class="bg-white p-4 rounded shadow mb-4">
      <h3 class="font-semibold mb-2">Encargados</h3>
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm lg:text-base">
        <thead><tr><th class="p-2">Nombre</th><th class="p-2">Email</th><th class="p-2">Área</th><th class="p-2">Turno</th><th class="p-2">Línea</th><th class="p-2">Puesto</th><th class="p-2">Código</th><th class="p-2">Acciones</th></tr></thead>
        <tbody>
          <tr v-for="user in encargados" :key="user._id">
            <td class="p-2">{{ user.name }}</td>
            <td class="p-2">{{ user.email }}</td>
            <td class="p-2">{{ user.area }}</td>
            <td class="p-2">{{ user.turno === 'dia' ? 'Día' : user.turno === 'noche' ? 'Noche' : '' }}</td>
            <td class="p-2">{{ user.linea || '-' }}</td>
            <td class="p-2">{{ user.puesto || '-' }}</td>
            <td class="p-2">{{ user.codigo || '-' }}</td>
            <td class="p-2 flex flex-col sm:flex-row gap-1">
              <button @click="editUser(user)" class="px-2 py-1 bg-yellow-500 text-white rounded text-xs sm:text-sm">Editar</button>
              <button @click="deleteUser(user._id)" class="px-2 py-1 bg-red-500 text-white rounded text-xs sm:text-sm">Eliminar</button>
            </td>
          </tr>
        </tbody>
        </table>
      </div>
    </div>

    <div class="bg-white p-4 rounded shadow">
      <h3 class="font-semibold mb-2">Trabajadores</h3>
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm lg:text-base">
        <thead><tr><th class="p-2">Nombre</th><th class="p-2">Email</th><th class="p-2">Área</th><th class="p-2">Turno</th><th class="p-2">Línea</th><th class="p-2">Puesto</th><th class="p-2">Código</th><th class="p-2">Acciones</th></tr></thead>
        <tbody>
          <tr v-for="user in trabajadores" :key="user._id">
            <td class="p-2">{{ user.name }}</td>
            <td class="p-2">{{ user.email }}</td>
            <td class="p-2">{{ user.area }}</td>
            <td class="p-2">{{ user.turno === 'dia' ? 'Día' : user.turno === 'noche' ? 'Noche' : '' }}</td>
            <td class="p-2">{{ user.linea || '-' }}</td>
            <td class="p-2">{{ user.puesto || '-' }}</td>
            <td class="p-2">{{ user.codigo || '-' }}</td>
            <td class="p-2 flex flex-col sm:flex-row gap-1">
              <button @click="editUser(user)" class="px-2 py-1 bg-yellow-500 text-white rounded text-xs sm:text-sm">Editar</button>
              <button @click="deleteUser(user._id)" class="px-2 py-1 bg-red-500 text-white rounded text-xs sm:text-sm">Eliminar</button>
            </td>
          </tr>
        </tbody>
        </table>
      </div>
    </div>

    <div v-if="editingUser" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-white p-6 rounded shadow max-w-md w-full">
        <h3 class="font-semibold mb-4">Editar Usuario</h3>
        <form @submit.prevent="updateUser">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <input v-model="editingUser.name" placeholder="Nombre" class="border p-2 rounded" required />
            <input v-model="editingUser.email" type="email" placeholder="Email" class="border p-2 rounded" required />
            <input v-model="editingUser.password" type="password" placeholder="Nueva Contraseña (opcional)" class="border p-2 rounded" />
            <select v-model="editingUser.role" class="border p-2 rounded" required>
              <option value="ADMIN">Admin</option>
              <option value="ENCARGADO">Encargado</option>
              <option value="WORKER">Trabajador</option>
            </select>
            <select v-model="editingUser.area" class="border p-2 rounded" v-if="editingUser.role !== 'ADMIN'">
              <option value="Manufactura">Manufactura</option>
              <option value="Envasado">Envasado</option>
              <option value="Soporte">Soporte</option>
            </select>
            <select v-model="editingUser.turno" class="border p-2 rounded" v-if="editingUser.role !== 'ADMIN'">
              <option value="">Seleccionar Turno</option>
              <option value="dia">Día</option>
              <option value="noche">Noche</option>
            </select>
            <input v-model="editingUser.linea" placeholder="Línea" class="border p-2 rounded" v-if="editingUser.role !== 'ADMIN'" />
            <input v-model="editingUser.puesto" placeholder="Puesto" class="border p-2 rounded" v-if="editingUser.role !== 'ADMIN'" />
            <input v-model="editingUser.codigo" placeholder="Código" class="border p-2 rounded" v-if="editingUser.role !== 'ADMIN'" />
          </div>
          <div class="flex flex-col sm:flex-row justify-end gap-2 mt-4">
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded">Actualizar</button>
            <button @click="editingUser = null" class="px-4 py-2 bg-gray-600 text-white rounded">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api';
import { ref, onMounted } from 'vue';

export default {
  setup() {
    const users = ref([]);
    const encargados = ref([]);
    const trabajadores = ref([]);
    const showCreateForm = ref(false);
    const newUser = ref({ name: '', email: '', password: '', role: '', area: '', turno: '', linea: '', puesto: '', codigo: '' });
    const editingUser = ref(null);

    onMounted(fetchUsers);

    async function fetchUsers() {
      try {
        const res = await api.get('/auth/users');
        users.value = res.data;
        encargados.value = res.data.filter(u => u.role === 'ENCARGADO');
        trabajadores.value = res.data.filter(u => u.role === 'WORKER');
      } catch (err) {
        window.showToast('Error al cargar usuarios', 'error');
      }
    }

    async function createUser() {
      try {
        await api.post('/auth/users', newUser.value);
        showCreateForm.value = false;
        newUser.value = { name: '', email: '', password: '', role: '', area: '', turno: '', linea: '', puesto: '', codigo: '' };
        fetchUsers();
        window.showToast('Usuario creado', 'success');
      } catch (err) {
        window.showToast('Error al crear usuario', 'error');
      }
    }

    function editUser(user) {
      editingUser.value = { ...user };
    }

    async function updateUser() {
      try {
        await api.put(`/auth/users/${editingUser.value._id}`, editingUser.value);
        editingUser.value = null;
        fetchUsers();
        window.showToast('Usuario actualizado', 'success');
      } catch (err) {
        window.showToast('Error al actualizar usuario', 'error');
      }
    }

    async function deleteUser(id) {
      if (confirm('¿Eliminar usuario?')) {
        try {
          await api.delete(`/auth/users/${id}`);
          fetchUsers();
          window.showToast('Usuario eliminado', 'success');
        } catch (err) {
          window.showToast('Error al eliminar usuario', 'error');
        }
      }
    }

    return {
      users,
      encargados,
      trabajadores,
      showCreateForm,
      newUser,
      editingUser,
      fetchUsers,
      createUser,
      editUser,
      updateUser,
      deleteUser
    };
  }
};
</script>
