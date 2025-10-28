<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <h1 class="text-2xl lg:text-3xl font-bold text-gray-800 mb-4">Panel de Trabajador</h1>
    <p class="mt-4 text-gray-600 mb-4">Bienvenido al sistema de control de asistencia.</p>

    <div class="bg-white p-4 rounded shadow">
      <h3 class="font-semibold mb-2">Historial de Asistencia</h3>
      <div class="mb-2 flex flex-col sm:flex-row gap-2">
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <label class="text-sm">Desde:</label>
          <input v-model="fromDate" type="date" class="border p-2 rounded" />
        </div>
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <label class="text-sm">Hasta:</label>
          <input v-model="toDate" type="date" class="border p-2 rounded" />
        </div>
        <button @click="fetchAttendance" class="px-4 py-2 bg-blue-500 text-white rounded text-sm">Buscar</button>
      </div>
      <div v-if="attendanceRecords.length > 0" class="overflow-x-auto">
        <table class="min-w-full text-sm lg:text-base">
        <thead>
          <tr>
            <th class="p-2">Fecha</th>
            <th class="p-2">Estado</th>
            <th class="p-2">Área</th>
            <th class="p-2">Turno</th>
            <th class="p-2">Observación</th>
            <th class="p-2">Marcado por</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in attendanceRecords" :key="r._id">
            <td class="p-2">{{ new Date(r.date).toLocaleDateString() }}</td>
            <td class="p-2">{{ r.status === 'P' ? 'Presente' : r.status === 'T' ? 'Tardanza' : 'Falta' }}</td>
            <td class="p-2">{{ r.area }}</td>
            <td class="p-2">{{ r.turno === 1 ? 'Día' : 'Noche' }}</td>
            <td class="p-2">{{ r.observation || '-' }}</td>
            <td class="p-2">{{ r.recordedBy.name }}</td>
          </tr>
        </tbody>
        </table>
      </div>
      <p v-else>No hay registros de asistencia.</p>
    </div>
  </div>
</template>

<script>
import api from '../api';
import { ref, onMounted } from 'vue';
export default {
  setup(){
    const attendanceRecords = ref([]);
    const fromDate = ref('');
    const toDate = ref('');
    onMounted(() => {
      // Set default dates to last 30 days
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      fromDate.value = thirtyDaysAgo.toISOString().split('T')[0];
      toDate.value = today.toISOString().split('T')[0];
      fetchAttendance();
    });
    async function fetchAttendance(){
      const params = {};
      if(fromDate.value) params.from = fromDate.value;
      if(toDate.value) params.to = toDate.value;
      const res = await api.get('/attendance/report', { params }).catch(()=>null);
      if(res) attendanceRecords.value = res.data;
    }
    return { attendanceRecords, fromDate, toDate, fetchAttendance };
  }
};
</script>

<style scoped>
</style>
