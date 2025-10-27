<template>
  <div class="p-6">
    <h1 class="text-2xl mb-4">Panel Encargado</h1>
    <div v-if="currentAssignment" class="bg-blue-100 p-4 rounded shadow mb-4">
      <h3 class="font-semibold">Tu asignación actual</h3>
      <p>Área: {{ getAssignedArea() }}</p>
      <p>Turno: {{ getAssignedTurnoLabel() }}</p>
      <p>Periodo: {{ new Date(currentAssignment.startDate).toLocaleDateString() }} - {{ new Date(currentAssignment.endDate).toLocaleDateString() }}</p>
    </div>

    <div v-if="currentAssignment" class="bg-white p-4 rounded shadow mb-4">
      <h3 class="font-semibold mb-2">Días de asistencia asignados</h3>
      <div class="flex flex-wrap gap-2">
        <div v-for="day in assignmentDays" :key="day.date" class="border p-2 rounded shadow hover:bg-gray-50 cursor-pointer text-center" @click="selectDay(day)">
          <div class="text-sm font-semibold">{{ day.label }}</div>
          <div class="text-xs text-gray-600">{{ day.dateFormatted }}</div>
          <div class="text-xs" :class="day.finalized ? 'text-green-600' : 'text-orange-600'">
            {{ day.finalized ? 'Finalizado' : 'Pendiente' }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedDay" class="bg-white p-4 rounded shadow mb-4">
      <h3 class="font-semibold mb-2">Marcar asistencia para {{ selectedDay.label }} - {{ selectedDay.dateFormatted }}</h3>
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
              <select v-model="attendance[w._id].status" class="border p-1 rounded" :disabled="selectedDay.finalized">
                <option value="">Seleccionar</option>
                <option value="P">Presente</option>
                <option value="T">Tardanza</option>
                <option value="F">Falta</option>
              </select>
            </td>
            <td class="border border-gray-300 p-2">
              <input v-model="attendance[w._id].observation" placeholder="Observación" class="border p-1 w-full rounded" :disabled="selectedDay.finalized" />
            </td>
            <td class="border border-gray-300 p-2">
              <button @click="markForWorker(w._id)" class="px-3 py-1 bg-blue-500 text-white rounded" :disabled="selectedDay.finalized">Marcar</button>
            </td>
          </tr>
        </tbody>
      </table>
      <button @click="markAllPresent" class="mt-4 px-4 py-2 bg-green-600 text-white rounded" :disabled="selectedDay.finalized">Marcar todos como Presentes</button>
      <button @click="finalizeAttendance" class="mt-4 ml-4 px-4 py-2 bg-red-600 text-white rounded" :disabled="selectedDay.finalized">Finalizar asistencia para este día</button>
    </div>

    <div class="bg-gray-100 p-4 rounded shadow">
      <h3 class="font-semibold mb-2">Registros de asistencia del período asignado</h3>
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
    const userId = ref(localStorage.getItem('userId'));
    const attendanceRecords = ref([]);
    const attendance = reactive({});
    const selectedDay = ref(null);
    const assignmentDays = ref([]);

    onMounted(async ()=> {
      try {
        const currentAssignRes = await api.get('/admin/assignment/current');
        currentAssignment.value = currentAssignRes.data;
        generateAssignmentDays();
        await fetchWorkers();
      } catch (error) {
        console.error('Error fetching current assignment:', error);
        window.showToast('No tienes asignación actual o error al cargar', 'error');
        // Fallback: try to fetch workers anyway
        try {
          await fetchWorkers();
        } catch (err) {
          console.error('Error fetching workers:', err);
        }
      }

      fetchAttendance();
    });

    function generateAssignmentDays(){
      const days = [];
      const start = new Date(currentAssignment.value.startDate);
      const end = new Date(currentAssignment.value.endDate);
      let dayCount = 1;
      for(let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)){
        const dateStr = d.toISOString().split('T')[0];
        days.push({
          date: dateStr,
          dateFormatted: d.toLocaleDateString(),
          label: `Día ${dayCount}`,
          finalized: false
        });
        dayCount++;
      }
      assignmentDays.value = days;
    }

    async function fetchWorkers(){
      try {
        const workersRes = await api.get('/admin/workers');
        const encAssign = findEncargadoAssignment(currentAssignment.value, userId.value);
        if(encAssign){
          workers.value = workersRes.data.filter(w => w.area === encAssign.area && Number(w.turno) === Number(encAssign.turno));
        } else {
          workers.value = workersRes.data;
        }
        workers.value.forEach(w => {
          attendance[w._id] = { status: '', observation: '' };
        });
      } catch (error) {
        console.error('Error fetching workers:', error);
        window.showToast('Error al cargar trabajadores', 'error');
      }
    }

    async function selectDay(day){
      selectedDay.value = day;
      // Reset attendance for all workers
      workers.value.forEach(w => {
        attendance[w._id] = { status: '', observation: '' };
      });
      // Load existing attendance for this day if any
      const existing = attendanceRecords.value.filter(r => new Date(r.date).toISOString().split('T')[0] === day.date);
      existing.forEach(r => {
        if(attendance[r.worker._id]){
          attendance[r.worker._id].status = r.status;
          attendance[r.worker._id].observation = r.observation;
        }
      });
      // Check if finalized
      day.finalized = existing.some(r => r.finalized);
    }

    async function markForWorker(workerId){
      if(selectedDay.value.finalized) return;
      const att = attendance[workerId];
      if(!att.status) return window.showToast('Selecciona estado para este trabajador', 'error');
      try {
        const payload = { date: selectedDay.value.date, workerId, status: att.status, observation: att.observation };
        await api.post('/attendance/mark', payload);
        window.showToast('Marcación guardada para ' + workers.value.find(w => w._id === workerId).name, 'success');
        fetchAttendance();
      } catch (error) {
        console.error('Error marking attendance:', error);
        window.showToast('Error al marcar asistencia: ' + (error.response?.data?.msg || error.message), 'error');
      }
    }

    async function markAllPresent(){
      if(selectedDay.value.finalized) return;
      try {
        for(const w of workers.value){
          const payload = { date: selectedDay.value.date, workerId: w._id, status: 'P', observation: '' };
          await api.post('/attendance/mark', payload);
        }
        window.showToast('Todos marcados como Presentes', 'success');
        fetchAttendance();
        // Update attendance reactive object
        workers.value.forEach(w => {
          attendance[w._id].status = 'P';
          attendance[w._id].observation = '';
        });
      } catch (error) {
        console.error('Error marking all present:', error);
        window.showToast('Error al marcar todos: ' + (error.response?.data?.msg || error.message), 'error');
      }
    }

    async function finalizeAttendance(){
      if(selectedDay.value.finalized) return;
      const markedWorkers = workers.value.filter(w => attendance[w._id].status);
      if (markedWorkers.length < workers.value.length) {
        return window.showToast('Debes marcar asistencia para todos los trabajadores antes de finalizar', 'error');
      }
      try {
        await api.post('/attendance/finalize', { date: selectedDay.value.date });
        window.showToast('Asistencia finalizada para ' + selectedDay.value.label, 'success');
        selectedDay.value.finalized = true;
        fetchAttendance();
        // Reset attendance for next day
        workers.value.forEach(w => {
          attendance[w._id] = { status: '', observation: '' };
        });
        selectedDay.value = null;
      } catch (error) {
        console.error('Error finalizing attendance:', error);
        window.showToast('Error al finalizar: ' + (error.response?.data?.msg || error.message), 'error');
      }
    }

    async function fetchAttendance(){
      try {
        const res = await api.get('/attendance/report');
        attendanceRecords.value = res.data;
        // Update finalized status for days
        assignmentDays.value.forEach(day => {
          const dayRecords = res.data.filter(r => new Date(r.date).toISOString().split('T')[0] === day.date);
          day.finalized = dayRecords.some(r => r.finalized);
        });
      } catch (error) {
        console.error('Error fetching attendance:', error);
        // Don't show toast for this, as it's called on mount
      }
    }

    function findEncargadoAssignment(assignDoc, uid) {
      if (!assignDoc || !Array.isArray(assignDoc.assignments)) return null;
      return assignDoc.assignments.find(a => {
        if (!a) return false;
        const enc = a.encargado;
        if (!enc) return false;
        const encId = (typeof enc === 'object') ? (enc._id || enc.id || '') : String(enc);
        return String(encId) === String(uid);
      }) || null;
    }

    function getAssignedArea() {
      const a = findEncargadoAssignment(currentAssignment.value, userId.value);
      return a ? a.area : 'No asignado';
    }
    function getAssignedTurnoLabel() {
      const a = findEncargadoAssignment(currentAssignment.value, userId.value);
      if (!a || !a.turno) return 'No asignado';
      return Number(a.turno) === 1 ? 'Día' : 'Noche';
    }

    return { workers, currentAssignment, userId, attendanceRecords, attendance, markForWorker, markAllPresent, finalizeAttendance, getAssignedArea, getAssignedTurnoLabel, selectedDay, assignmentDays, selectDay };
  }
};
</script>
