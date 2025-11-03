<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <h1 class="text-2xl lg:text-3xl font-bold mb-4">Admin Dashboard</h1>
    <div class="mb-4">
  <button @click="toggleAssignForm" class="px-4 py-2 bg-indigo-600 text-white rounded mr-2">Asignaciones</button>
      <button @click="toggleUserManagement" class="px-4 py-2 bg-blue-600 text-white rounded mr-2">Gestión de Usuarios</button>
      <button @click="toggleHistory" class="px-4 py-2 bg-gray-600 text-white rounded">Historial de Asignaciones</button>
    </div>

    <div v-if="showAssignForm" class="bg-gray-100 p-4 rounded shadow mb-4">
      <h3 class="font-semibold mb-2">Asignaciones</h3>
      <div class="mb-3">
        <button @click="newAssignmentReset" class="px-3 py-1 bg-yellow-500 text-white rounded mr-2">Nuevo</button>
      </div>
      <div v-if="assignmentsHistory.length" class="mb-4">
        <h4 class="font-medium mb-2">Asignaciones existentes (seleccionar para editar o eliminar)</h4>
        <div v-for="doc in assignmentsHistory" :key="doc._id" class="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 p-2 border rounded gap-2">
          <div class="flex-1">
            <div class="font-medium text-sm sm:text-base">Periodo: {{ new Date(doc.startDate).toLocaleDateString() }} - {{ new Date(doc.endDate).toLocaleDateString() }}</div>
            <div class="text-xs sm:text-sm text-gray-600">Encargados: {{ (doc.assignments||[]).map(a=> a.encargado ? a.encargado.name : '').filter(Boolean).join(', ') }}</div>
          </div>
          <div class="flex items-center gap-2">
            <button @click.prevent="editAssignment(doc)" class="px-2 py-1 bg-indigo-500 text-white rounded text-xs sm:text-sm">Editar</button>
            <button @click.prevent="deleteAssignment(doc._id)" class="px-2 py-1 bg-red-600 text-white rounded text-xs sm:text-sm">Eliminar</button>
          </div>
        </div>
      </div>
      <div v-else class="text-gray-600">No hay asignaciones registradas.</div>
    </div>

    <!-- Formulario separado: solo aparece cuando el usuario pulsa Nuevo o Editar -->
  <div v-if="newAssignmentMode" class="bg-white p-4 rounded shadow mb-4">
      <h3 class="font-semibold mb-2">Crear/Editar Asignación</h3>
      <label>Fecha de inicio</label>
      <input v-model="newAssignment.startDate" type="date" class="border p-2 rounded mb-2 w-full" />
      <label>Fecha de fin</label>
      <input v-model="newAssignment.endDate" type="date" class="border p-2 rounded mb-2 w-full" />

  <div v-for="(a, idx) in newAssignment.assignments" :key="idx" class="mb-2 grid grid-cols-1 sm:grid-cols-5 gap-2">
  <select v-model="a.encargado" @change="setTurnoFromEncargado(a)" class="border p-2 rounded col-span-1 sm:col-span-2">
          <option value="">Seleccionar Encargado</option>
          <option v-for="e in encargados" :value="e._id">{{ e.name }}</option>
        </select>
        <select v-model="a.area" class="border p-2 rounded col-span-1" disabled>
          <option value="Area 1">Area 1</option>
          <option value="Area 2">Area 2</option>
        </select>
        <select v-model="a.turno" class="border p-2 rounded col-span-1" disabled>
          <option value="dia">Día</option>
          <option value="noche">Noche</option>
        </select>
        <button @click="removeAssignment(idx)" class="px-2 py-1 bg-red-500 text-white rounded col-span-1">Quitar</button>
      </div>
      <button @click="addAssignment" class="px-4 py-2 bg-blue-500 text-white rounded mr-2">Agregar Asignación</button>
      <button @click="saveAssignment" class="px-4 py-2 bg-green-500 text-white rounded mr-2">Guardar</button>
      <button @click="cancelNewAssignment" class="px-4 py-2 bg-gray-400 text-white rounded">Cancelar</button>
    </div>

    <div v-if="showUserManagement" class="bg-white p-4 rounded shadow mb-4">
      <UserManagement />
    </div>

    <div v-if="assignment" class="bg-white p-4 rounded shadow">
      <h2 class="font-semibold mb-2">Asignación para {{ weekString }}</h2>
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm lg:text-base">
        <thead><tr><th class="p-2">Encargado</th><th class="p-2">Área</th><th class="p-2">Turno</th></tr></thead>
        <tbody>
          <tr v-for="a in assignment.assignments" :key="a.encargado._id">
            <td class="p-2">{{ a.encargado.name }}</td>
            <td class="p-2">{{ a.area }}</td>
            <td class="p-2">{{ a.turno === 'dia' ? 'Día' : 'Noche' }}</td>
          </tr>
        </tbody>
        </table>
      </div>
    </div>

    <div v-if="showHistory" class="mt-6 bg-white p-4 rounded shadow">
      <h2 class="font-semibold mb-2">Historial de Asignaciones (por periodo)</h2>
      <div v-if="assignmentsHistory.length === 0" class="text-gray-500">No hay asignaciones registradas aún.</div>
      <div v-for="doc in assignmentsHistory" :key="doc._id" class="mb-4 border p-3 rounded">
        <div class="font-medium">Periodo: {{ new Date(doc.startDate).toLocaleDateString() }} - {{ new Date(doc.endDate).toLocaleDateString() }}</div>
        <div class="overflow-x-auto">
          <table class="min-w-full mt-2 text-sm lg:text-base">
          <thead><tr><th class="p-2">Encargado</th><th class="p-2">Área</th><th class="p-2">Turno</th></tr></thead>
          <tbody>
            <tr v-for="a in doc.assignments" :key="a.encargado._id" v-if="a.encargado">
              <td class="p-2">{{ a.encargado.name }}</td>
              <td class="p-2">{{ a.area }}</td>
              <td class="p-2">{{ a.turno === 'dia' ? 'Día' : 'Noche' }}</td>
            </tr>
          </tbody>
          </table>
        </div>
      </div>
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
    const trabajadores = ref([]);
    const newAssignment = ref({ startDate: '', endDate: '', assignments: [] });
  const assignmentsHistory = ref([]);
  const showHistory = ref(false);
  const newAssignmentMode = ref(false);

    onMounted(async () => {
      await fetchAssignment();
      await fetchEncargados();
      await fetchTrabajadores();
      // don't auto-open history; just preload
      await fetchAssignmentsHistory();
    });
    // helper: format date for <input type="date"> (YYYY-MM-DD)
    function toDateInputValue(date){
      const d = new Date(date);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth()+1).padStart(2,'0');
      const dd = String(d.getDate()).padStart(2,'0');
      return `${yyyy}-${mm}-${dd}`;
    }
    async function fetchAssignment(){
      // Use the backend "current" endpoint to avoid timezone / date parsing mismatches
      const resp = await api.get('/admin/assignment/current').catch(()=>null);
      if(resp && resp.data && Array.isArray(resp.data) && resp.data.length > 0) {
        // Take the first assignment if it's an array
        const currentAssignment = resp.data[0];
        assignment.value = currentAssignment;
        weekString.value = `${new Date(currentAssignment.startDate).toLocaleDateString()} - ${new Date(currentAssignment.endDate).toLocaleDateString()}`;
      } else {
        assignment.value = null;
        weekString.value = '';
      }
    }
    async function fetchAssignmentsHistory(){
      const res = await api.get('/admin/assignments').catch(()=>null);
      if(res && res.data) assignmentsHistory.value = res.data;
      else assignmentsHistory.value = [];
    }
    // fetch assignment for a given weekStart date (ISO or yyyy-mm-dd)
    async function fetchAssignmentForWeek(weekStart){
      if(!weekStart) return null;
      const iso = new Date(weekStart).toISOString();
      const res = await api.get(`/admin/assignment/${encodeURIComponent(iso)}`).catch(()=>null);
      if(res && res.data) return res.data;
      return null;
    }
    function toggleHistory(){
      showHistory.value = !showHistory.value;
      if(showHistory.value){
        // hide other panels
        showAssignForm.value = false;
        showUserManagement.value = false;
      }
    }
    async function toggleAssignForm(){
      showAssignForm.value = !showAssignForm.value;
      if(showAssignForm.value){
        showUserManagement.value = false;
        showHistory.value = false;
        // when opening the Assignaciones panel, show list and Nuevo button only
        newAssignmentMode.value = false;
        await fetchAssignmentsHistory();
      }
    }
    function toggleUserManagement(){
      showUserManagement.value = !showUserManagement.value;
      if(showUserManagement.value){
        showAssignForm.value = false;
        showHistory.value = false;
      }
    }
    async function fetchEncargados(){
      const res = await api.get('/admin/encargados').catch(()=>null);
      if(res) encargados.value = res.data;
    }
    async function fetchTrabajadores(){
      const res = await api.get('/auth/users').catch(()=>null);
      if(res) trabajadores.value = res.data.filter(u => u.role === 'WORKER');
    }
    function newAssignmentReset(){
      newAssignment.value = { startDate: toDateInputValue(new Date()), endDate: toDateInputValue(new Date()), assignments: [{ encargado: '', area: '', turno: '' }] };
      newAssignmentMode.value = true;
    }
    function editAssignment(doc){
      // open form and populate with doc
      showAssignForm.value = true;
      showUserManagement.value = false;
      showHistory.value = false;
      // set startDate input value (YYYY-MM-DD)
      newAssignmentMode.value = true;
      newAssignment.value.startDate = toDateInputValue(doc.startDate);
      newAssignment.value.endDate = toDateInputValue(doc.endDate);
      // map assignments (doc.assignments may have encargado populated)
      newAssignment.value.assignments = (doc.assignments || []).filter(a=>a.encargado).map(a => ({ encargado: a.encargado._id || a.encargado, area: a.area, turno: a.turno }));
    }
    function cancelNewAssignment(){
      newAssignmentMode.value = false;
      newAssignment.value = { startDate: '', endDate: '', assignments: [] };
    }
    async function deleteAssignment(id){
      if(!confirm('Eliminar asignación del periodo?')) return;
      const res = await api.delete(`/admin/assignment/${id}`).catch(()=>null);
      if(res && res.data){
        window.showToast('Asignación eliminada', 'success');
        await fetchAssignmentsHistory();
        // if the currently displayed assignment is the deleted one, clear it
        if(assignment.value && assignment.value._id === id){
          assignment.value = null;
          weekString.value = '';
        }
      } else {
        window.showToast('Error al eliminar asignación', 'error');
      }
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
    // rotation functionality removed
    function addAssignment(){
      newAssignment.value.assignments.push({ encargado: '', area: '', turno: '' });
    }
    function removeAssignment(idx){
      newAssignment.value.assignments.splice(idx, 1);
    }
    async function saveAssignment(){
      if(!newAssignment.value.startDate || !newAssignment.value.endDate || newAssignment.value.assignments.length === 0) {
        window.showToast('Completa los campos', 'error');
        return;
      }
      // client-side validation: no duplicate encargados
      const encs = newAssignment.value.assignments.map(a=>a.encargado).filter(Boolean);
      if(new Set(encs).size !== encs.length){
        window.showToast('Hay encargados duplicados en la asignación', 'error');
        return;
      }
      // ensure each assignment has encargado
      for(const a of newAssignment.value.assignments){
        if(!a.encargado){
          window.showToast('Cada asignación debe tener un encargado', 'error');
          return;
        }
      }
      // ensure each assignment includes area and turno (derive from selected encargado if missing)
      const assignmentsPayload = newAssignment.value.assignments.map(a => {
        const enc = encargados.value.find(e => (e._id === a.encargado) || (e._id === (a.encargado && a.encargado.toString && a.encargado.toString())) );
        return {
          encargado: a.encargado,
          area: a.area || (enc ? enc.area : ''),
          turno: a.turno || (enc ? enc.turno : '')
        };
      });

      const payload = {
        startDate: newAssignment.value.startDate,
        endDate: newAssignment.value.endDate,
        assignments: assignmentsPayload
      };
      try {
        const res = await api.post('/admin/assignment', payload);
        window.showToast('Asignación guardada', 'success');
        showAssignForm.value = false;
        // use the returned document (upsert result) to show the period that was just saved
        if (res && res.data) {
          assignment.value = res.data;
          weekString.value = `${new Date(res.data.startDate).toLocaleDateString()} - ${new Date(res.data.endDate).toLocaleDateString()}`;
          // Refresh the current assignment display
          await fetchAssignment();
        }
        // refresh history after save
        await fetchAssignmentsHistory();
        // clear form
        newAssignment.value = { startDate: '', endDate: '', assignments: [] };
      } catch (err) {
        window.showToast('Error al guardar asignación', 'error');
      }
    }
    return { assignment, weekString, showAssignForm, showUserManagement, encargados, trabajadores, newAssignment, addAssignment, removeAssignment, saveAssignment, setTurnoFromEncargado, assignmentsHistory, showHistory, toggleHistory, toggleAssignForm, toggleUserManagement, newAssignmentReset, editAssignment, deleteAssignment, newAssignmentMode, cancelNewAssignment };
  }
};
</script>
