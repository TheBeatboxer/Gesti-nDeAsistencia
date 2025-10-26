 <template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">Admin Dashboard</h1>
    <div class="mb-4">
      <button @click="showAssignForm = !showAssignForm" class="px-4 py-2 bg-indigo-600 text-white rounded mr-2">Crear/Editar asignación</button>
      <button @click="rotate" class="px-4 py-2 bg-green-600 text-white rounded mr-2">Rotar asignaciones (Semana siguiente)</button>
      <button @click="showUserManagement = !showUserManagement" class="px-4 py-2 bg-blue-600 text-white rounded">Gestión de Usuarios</button>
    </div>

    <div v-if="showAssignForm" class="bg-gray-100 p-4 rounded shadow mb-4">
      <h3 class="font-semibold mb-2">Crear/Editar Asignación</h3>
      <label>Fecha de inicio de semana (Lunes):</label>
      <input v-model="newAssignment.weekStart" type="date" class="border p-2 rounded mb-2 w-full" />
      <div v-for="(a, idx) in newAssignment.assignments" :key="idx" class="mb-2">
        <select v-model="a.encargado" @change="setTurnoFromEncargado(a)" class="border p-2 rounded mr-2">
          <option value="">Seleccionar Encargado</option>
          <option v-for="e in encargados" :value="e._id">{{ e.name }}</option>
        </select>
        <select v-model="a.area" class="border p-2 rounded mr-2" disabled>
          <option value="Manufactura">Manufactura</option>
          <option value="Envasado">Envasado</option>
        </select>
        <select v-model.number="a.turno" class="border p-2 rounded mr-2" disabled>
          <option :value="1">Día</option>
          <option :value="2">Noche</option>
        </select>
        <button @click="removeAssignment(idx)" class="px-2 py-1 bg-red-500 text-white rounded">Quitar</button>
      </div>
      <button @click="addAssignment" class="px-4 py-2 bg-blue-500 text-white rounded mr-2">Agregar Asignación</button>
      <button @click="saveAssignment" class="px-4 py-2 bg-green-500 text-white rounded">Guardar</button>
    </div>

    <div v-if="showUserManagement" class="bg-white p-4 rounded shadow mb-4">
      <UserManagement />
    </div>

    <div v-if="assignment" class="bg-white p-4 rounded shadow">
      <h2 class="font-semibold mb-2">Asignación para {{ weekString }}</h2>
      <table class="w-full">
        <thead><tr><th>Encargado</th><th>Área</th><th>Turno</th></tr></thead>
        <tbody>
          <tr v-for="a in assignment.assignments" :key="a.encargado._id">
            <td>{{ a.encargado.name }}</td>
            <td>{{ a.area }}</td>
            <td>{{ a.turno === 1 ? 'Día' : 'Noche' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import api from '../api';
import UserManagement from './UserManagement.vue';
import { ref, onMounted } from 'vue';
export default {
  components: { UserManagement },
  setup(){
    const assignment = ref(null);
    const weekString = ref('');
    const showAssignForm = ref(false);
    const showUserManagement = ref(false);
    const encargados = ref([]);
    const newAssignment = ref({ weekStart: '', assignments: [] });
    onMounted(async () => {
      fetchAssignment();
      fetchEncargados();
    });
    async function fetchAssignment(){
      // Use the backend "current" endpoint to avoid timezone / date parsing mismatches
      const resp = await api.get('/admin/assignment/current').catch(()=>null);
      if(resp && resp.data) {
        assignment.value = resp.data;
        weekString.value = new Date(resp.data.weekStart).toLocaleDateString();
      } else {
        assignment.value = null;
        weekString.value = '';
      }
    }
    async function fetchEncargados(){
      const res = await api.get('/admin/encargados').catch(()=>null);
      if(res) encargados.value = res.data;
    }
    function setTurnoFromEncargado(assignment){
      if(assignment.encargado){
        const enc = encargados.value.find(e => e._id === assignment.encargado);
        if(enc){
          assignment.area = enc.area;
          assignment.turno = enc.turno;
        }
      }
    }
    async function rotate(){
      const res = await api.post('/admin/assignment/rotate');
      assignment.value = res.data;
      weekString.value = new Date(res.data.weekStart).toLocaleDateString();
      window.showToast('Rotado: nueva asignación creada', 'success');
    }
    function addAssignment(){
      newAssignment.value.assignments.push({ encargado: '', area: '', turno: 0 });
    }
    function removeAssignment(idx){
      newAssignment.value.assignments.splice(idx, 1);
    }
    async function saveAssignment(){
      if(!newAssignment.value.weekStart || newAssignment.value.assignments.length === 0) {
        window.showToast('Completa los campos', 'error');
        return;
      }
      const payload = {
        weekStart: new Date(newAssignment.value.weekStart).toISOString(),
        assignments: newAssignment.value.assignments
      };
      try {
        const res = await api.post('/admin/assignment', payload);
        window.showToast('Asignación guardada', 'success');
        showAssignForm.value = false;
        fetchAssignment();
      } catch (err) {
        window.showToast('Error al guardar asignación', 'error');
      }
    }
    return { assignment, weekString, rotate, showAssignForm, showUserManagement, encargados, newAssignment, addAssignment, removeAssignment, saveAssignment, setTurnoFromEncargado };
  }
};
</script>
