<template>
  <div class="p-6">
    <h1 class="text-2xl mb-4">Panel Encargado</h1>
    <div v-if="currentAssignment" class="bg-blue-100 p-4 rounded shadow mb-4">
  <h3 class="font-semibold">Tu asignación actual</h3>
  <p>Área: {{ getAssignedArea() }}</p>
  <p>Turno: {{ getAssignedTurnoLabel() }}</p>
    </div>
    <div class="bg-white p-4 rounded shadow mb-4">
  <h3 class="font-semibold mb-2">Llamar asistencia - {{ getAttendanceDateLabel() }}</h3>
      <p class="text-sm text-gray-600 mb-4">Trabajadores asignados a tu área</p>
      <table class="w-full border-collapse border border-gray-300">
        <thead>
          <tr class="bg-gray-200">
            <th class="border border-gray-300 p-2">Trabajador</th>
            <th class="border border-gray-300 p-2">Estado</th>
            <th class="border border-gray-300 p-2">Observación</th>
            <th class="border border-gray-300 p-2">Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="w in workers" :key="w._id" class="hover:bg-gray-50">
            <td class="border border-gray-300 p-2">{{ w.name }} ({{ w.area }} - Turno {{ w.turno }})</td>
            <td class="border border-gray-300 p-2">
              <select v-model="attendance[w._id].status" class="border p-1 rounded">
                <option value="">Seleccionar</option>
                <option value="P">Presente</option>
                <option value="T">Tardanza</option>
                <option value="F">Falta</option>
              </select>
            </td>
            <td class="border border-gray-300 p-2">
              <input v-model="attendance[w._id].observation" placeholder="Observación" class="border p-1 w-full rounded" />
            </td>
            <td class="border border-gray-300 p-2">
              <button @click="markForWorker(w._id)" class="px-3 py-1 bg-blue-500 text-white rounded">Marcar</button>
            </td>
          </tr>
        </tbody>
      </table>
      <button @click="markAllPresent" class="mt-4 px-4 py-2 bg-green-600 text-white rounded">Marcar todos como Presentes</button>
    </div>

    <div class="bg-gray-100 p-4 rounded shadow">
      <h3 class="font-semibold mb-2">Registros de asistencia recientes</h3>
      <table class="w-full border-collapse border border-gray-300">
        <thead>
          <tr class="bg-gray-200">
            <th class="border border-gray-300 p-2">Fecha</th>
            <th class="border border-gray-300 p-2">Trabajador</th>
            <th class="border border-gray-300 p-2">Estado</th>
            <th class="border border-gray-300 p-2">Observación</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in attendanceRecords" :key="r._id" class="hover:bg-gray-50">
            <td class="border border-gray-300 p-2">{{ new Date(r.date).toLocaleDateString() }}</td>
            <td class="border border-gray-300 p-2">{{ r.worker.name }}</td>
            <td class="border border-gray-300 p-2">{{ r.status }}</td>
            <td class="border border-gray-300 p-2">{{ r.observation }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import api from '../api';
import { ref, onMounted, reactive } from 'vue';
export default {
  setup(){
    const workers = ref([]);
    const currentAssignment = ref(null);
    const userId = ref(localStorage.getItem('userId')); // Assuming userId is stored
    const attendanceRecords = ref([]);
    const attendance = reactive({}); // Object to hold status and observation per worker

    onMounted(async ()=> {
      // Get current assignment for the encargado
      const assignRes = await api.get('/admin/assignment/current').catch(()=>null);
      if(assignRes) {
        currentAssignment.value = assignRes.data;
        // Prefer deriving display data from the populated assignment (area/turno)
        // Fetch workers (backend will also attempt to filter for encargado role). If backend filtering
        // is out-of-sync with this assignment, we additionally filter client-side to ensure coherence.
        const workersRes = await api.get('/admin/workers').catch(()=>null);
        if(workersRes) {
          // client-side filter: match area and turno from assignment for this encargado
          const encAssign = findEncargadoAssignment(currentAssignment.value, userId.value);
          if (encAssign) {
            workers.value = workersRes.data.filter(w => w.area === encAssign.area && Number(w.turno) === Number(encAssign.turno));
          } else {
            workers.value = workersRes.data;
          }
          // Initialize attendance object for each worker
          workers.value.forEach(w => {
            attendance[w._id] = { status: '', observation: '' };
          });
        }
      } else {
        window.showToast('No tienes asignación para esta semana', 'error');
      }
      fetchAttendance();
    });

    async function markForWorker(workerId){
      const att = attendance[workerId];
      if(!att.status) return window.showToast('Selecciona estado para este trabajador', 'error');
      const payload = { date: new Date().toISOString(), workerId, status: att.status, observation: att.observation };
      const res = await api.post('/attendance/mark', payload);
      if(res) {
        window.showToast('Marcación guardada para ' + workers.value.find(w => w._id === workerId).name, 'success');
        fetchAttendance();
        // Reset for this worker
        att.status = '';
        att.observation = '';
      }
    }

    async function markAllPresent(){
      for(const w of workers.value){
        const payload = { date: new Date().toISOString(), workerId: w._id, status: 'P', observation: '' };
        await api.post('/attendance/mark', payload);
      }
      window.showToast('Todos marcados como Presentes', 'success');
      fetchAttendance();
    }

    async function fetchAttendance(){
      const res = await api.get('/attendance/report').catch(()=>null);
      if(res) attendanceRecords.value = res.data;
    }

      // Helper to find the assignment entry for this encargado (defensive: handles populated and unpopulated encargado)
      function findEncargadoAssignment(assignDoc, uid) {
        if (!assignDoc || !Array.isArray(assignDoc.assignments)) return null;
        return assignDoc.assignments.find(a => {
          if (!a) return false;
          const enc = a.encargado;
          if (!enc) return false;
          // enc may be an object (populated) or an id string
          const encId = (typeof enc === 'object') ? (enc._id || enc.id || '') : String(enc);
          return String(encId) === String(uid);
        }) || null;
      }

      // Derived display helpers for template
      function getAssignedArea() {
        const a = findEncargadoAssignment(currentAssignment.value, userId.value);
        return a ? a.area : 'No asignado';
      }
      function getAssignedTurnoLabel() {
        const a = findEncargadoAssignment(currentAssignment.value, userId.value);
        if (!a || !a.turno) return 'No asignado';
        return Number(a.turno) === 1 ? 'Día' : 'Noche';
      }
      function getAttendanceDateLabel() {
        // If there's a currentAssignment, compute the week range and show today's date if within the week,
        // otherwise show the week's start date as the date to call attendance.
        if (!currentAssignment.value || !currentAssignment.value.weekStart) return new Date().toLocaleDateString();
        const ws = new Date(currentAssignment.value.weekStart);
        ws.setHours(0,0,0,0);
        const we = new Date(ws);
        we.setDate(we.getDate() + 6);
        const today = new Date();
        today.setHours(0,0,0,0);
        const dateToShow = (today >= ws && today <= we) ? today : ws;
        return dateToShow.toLocaleDateString();
      }

    return { workers, currentAssignment, userId, attendanceRecords, attendance, markForWorker, markAllPresent, getAssignedArea, getAssignedTurnoLabel, getAttendanceDateLabel };
  }
};
</script>
