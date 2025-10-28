<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <h1 class="text-2xl lg:text-3xl mb-4">Panel Encargado</h1>
    <div v-if="currentAssignment" class="bg-blue-100 p-4 rounded shadow mb-4">
      <h3 class="font-semibold">Tu asignación actual</h3>
      <p>Área: {{ getAssignedArea() }}</p>
      <p>Turno: {{ getAssignedTurnoLabel() }}</p>
      <p>Periodo: {{ new Date(currentAssignment.startDate).toLocaleDateString() }} - {{ new Date(currentAssignment.endDate).toLocaleDateString() }}</p>
    </div>

    <div v-if="currentAssignment && !currentAssignment.finalized" class="bg-white p-4 rounded shadow mb-4">
      <h3 class="font-semibold mb-2">Días de asistencia asignados</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        <div v-for="day in assignmentDays" :key="day.date" class="border p-2 rounded shadow hover:bg-gray-50 cursor-pointer text-center" @click="selectDay(day)">
          <div class="text-sm font-semibold">{{ day.label }}</div>
          <div class="text-xs text-gray-600">{{ day.dateFormatted }}</div>
          <div class="text-xs" :class="day.finalized ? 'text-green-600' : 'text-orange-600'">
            {{ day.finalized ? 'Finalizado' : 'Pendiente' }}
          </div>
        </div>
      </div>
      <div v-if="allDaysFinalized" class="mt-4 text-center">
        <button @click="finalizePeriod" class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Finalizar periodo
        </button>
      </div>
    </div>

    <!-- Panel de marcación de asistencia -->
    <div v-if="selectedDay" class="bg-white p-4 rounded shadow mb-4">
      <h3 class="font-semibold mb-2">Marcar asistencia para {{ selectedDay.label }} - {{ selectedDay.dateFormatted }}</h3>
      <p class="text-sm text-gray-600 mb-4">Trabajadores asignados a tu área</p>
      <div class="overflow-x-auto">
        <table class="min-w-full border-collapse border border-gray-300 text-sm lg:text-base">
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
              <select v-model="attendance[w._id].status" class="border p-1 rounded w-full">
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
              <button
                @click="markForWorker(w._id)"
                class="px-3 py-1 rounded text-white text-xs sm:text-sm"
                :class="{
                  'bg-green-500 hover:bg-green-600': attendance[w._id].isMarked,
                  'bg-blue-500 hover:bg-blue-600': !attendance[w._id].isMarked
                }"
              >
                {{ attendance[w._id].isMarked ? 'Marcado' : 'Marcar' }}
              </button>
            </td>
          </tr>
        </tbody>
        </table>
      </div>
      <div class="mt-4 flex flex-col sm:flex-row gap-4">
        <button @click="markAllPresent" class="px-4 py-2 bg-green-600 text-white rounded text-sm">
          Marcar todos como Presentes
        </button>
        <button @click="finalizeAttendance" class="px-4 py-2 bg-red-600 text-white rounded text-sm">
          Finalizar asistencia para este día
        </button>
      </div>
    </div>

    <!-- Registros de asistencia finalizados -->
    <div v-if="!selectedDay" class="space-y-4">
      <div v-for="day in assignmentDays.filter(d => d.finalized)" :key="day.date" class="bg-gray-100 p-4 rounded shadow">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-semibold">Registros de asistencia - {{ day.label }} ({{ day.dateFormatted }})</h3>
          <button 
            @click="exportToPDF(day)"
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Exportar a PDF
          </button>
        </div>
        <div :id="'attendance-table-'+day.date">
          <div class="mb-4">
            <h4 class="font-medium">Datos del Encargado:</h4>
            <p>Área: {{ getAssignedArea() }}</p>
            <p>Turno: {{ getAssignedTurnoLabel() }}</p>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full border-collapse border border-gray-300 bg-white text-sm lg:text-base">
            <thead>
              <tr class="bg-gray-200">
                <th class="border border-gray-300 p-2">Trabajador</th>
                <th class="border border-gray-300 p-2">Estado</th>
                <th class="border border-gray-300 p-2">Observación</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in getAttendanceForDay(day.date)" :key="r._id" class="hover:bg-gray-50">
                <td class="border border-gray-300 p-2">{{ r.worker ? r.worker.name : 'Trabajador desconocido' }}</td>
                <td class="border border-gray-300 p-2">{{ getStatusLabel(r.status) }}</td>
                <td class="border border-gray-300 p-2">{{ r.observation }}</td>
              </tr>
            </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Panel de historial de periodos -->
    <div class="mt-8 bg-white p-6 rounded-lg shadow-lg">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold">Historial de Periodos</h2>
        <button
          @click="showPeriodHistory = !showPeriodHistory"
          class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          {{ showPeriodHistory ? 'Ocultar Historial' : 'Mostrar Historial' }}
        </button>
      </div>

      <div v-if="showPeriodHistory">
        <div class="overflow-x-auto">
          <table class="min-w-full bg-white border rounded-lg text-sm lg:text-base">
            <thead>
              <tr class="bg-gray-100">
                <th class="border p-3 text-left">Periodo</th>
                <th class="border p-3 text-left">Área</th>
                <th class="border p-3 text-left">Turno</th>
                <th class="border p-3 text-left">Finalizado el</th>
                <th class="border p-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="period in finalizedPeriods" :key="period._id" class="hover:bg-gray-50">
                <td class="border p-3">{{ new Date(period.startDate).toLocaleDateString() }} - {{ new Date(period.endDate).toLocaleDateString() }}</td>
                <td class="border p-3">{{ getAssignedAreaForPeriod(period) }}</td>
                <td class="border p-3">{{ getAssignedTurnoLabelForPeriod(period) }}</td>
                <td class="border p-3">{{ new Date(period.finalizedAt).toLocaleDateString() }}</td>
                <td class="border p-3">
                  <button
                    @click="exportPeriodPDF(period)"
                    class="bg-blue-500 hover:bg-blue-700 text-white text-xs sm:text-sm py-1 px-2 rounded"
                  >
                    Exportar PDF
                  </button>
                </td>
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
import { ref, onMounted, reactive, computed } from 'vue';
import html2pdf from 'html2pdf.js';

export default {
  setup() {
    const workers = ref([]);
    const currentAssignment = ref(null);
    const userId = ref(localStorage.getItem('userId'));
    const attendanceRecords = ref([]);
    const attendance = reactive({});
    const selectedDay = ref(null);
    const assignmentDays = ref([]);
    const showPeriodHistory = ref(false);
    const finalizedPeriods = ref([]);

    onMounted(async ()=> {
      try {
        const currentAssignRes = await api.get('/admin/assignment/current');
        currentAssignment.value = currentAssignRes.data;
        generateAssignmentDays();
        await fetchWorkers();
        await fetchFinalizedPeriods();
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
          attendance[w._id] = { status: 'P', observation: '', isMarked: false };
        });
      } catch (error) {
        console.error('Error fetching workers:', error);
        window.showToast('Error al cargar trabajadores', 'error');
      }
    }

    async function selectDay(day){
      if (day.finalized) {
        return;
      }
      selectedDay.value = day;
      // Inicializar todos los trabajadores como Presentes por defecto
      workers.value.forEach(w => {
        attendance[w._id] = { status: 'P', observation: '', isMarked: false };
      });
      // Load existing attendance for this day if any
      const existing = attendanceRecords.value.filter(r => new Date(r.date).toISOString().split('T')[0] === day.date);
      existing.forEach(r => {
        if(attendance[r.worker._id]){
          attendance[r.worker._id].status = r.status;
          attendance[r.worker._id].observation = r.observation;
          attendance[r.worker._id].isMarked = true;
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
        attendance[workerId].isMarked = true;
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
          attendance[w._id].isMarked = true;
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
        
        // Actualizar el estado del día en assignmentDays
        const dayToUpdate = assignmentDays.value.find(d => d.date === selectedDay.value.date);
        if (dayToUpdate) {
          dayToUpdate.finalized = true;
        }
        
        // Actualizar registros de asistencia
        await fetchAttendance();
        
        // Reset attendance y selectedDay
        workers.value.forEach(w => {
          attendance[w._id] = { status: 'P', observation: '', isMarked: false };
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

    function getAttendanceForDay(date) {
      return attendanceRecords.value.filter(r => 
        new Date(r.date).toISOString().split('T')[0] === date && r.finalized
      );
    }

    const allDaysFinalized = computed(() => {
      return assignmentDays.value.length > 0 && assignmentDays.value.every(day => day.finalized);
    });

    function getStatusLabel(status) {
      const labels = {
        'P': 'Presente',
        'T': 'Tardanza',
        'F': 'Falta'
      };
      return labels[status] || status;
    }

    async function exportToPDF(day) {
      const element = document.getElementById('attendance-table-'+day.date);
      const opt = {
        margin: 1,
        filename: `asistencia-${day.dateFormatted}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      try {
        window.showToast('Generando PDF...', 'info');
        await html2pdf().set(opt).from(element).save();
        window.showToast('PDF generado exitosamente', 'success');
      } catch (error) {
        console.error('Error generating PDF:', error);
        window.showToast('Error al generar PDF', 'error');
      }
    }

    async function fetchFinalizedPeriods() {
      try {
        const res = await api.get('/admin/finalized-periods');
        finalizedPeriods.value = res.data;
      } catch (error) {
        console.error('Error fetching finalized periods:', error);
      }
    }

    async function finalizePeriod() {
      try {
        await api.post('/admin/finalize-period');
        window.showToast('Periodo finalizado exitosamente', 'success');
        // Refresh current assignment and finalized periods
        const currentAssignRes = await api.get('/admin/assignment/current');
        currentAssignment.value = currentAssignRes.data;
        await fetchFinalizedPeriods();
      } catch (error) {
        console.error('Error finalizing period:', error);
        window.showToast('Error al finalizar periodo: ' + (error.response?.data?.msg || error.message), 'error');
      }
    }

    async function exportSingleDayPDF(date) {
      const dayRecords = attendanceRecords.value.filter(r => 
        new Date(r.date).toISOString().split('T')[0] === new Date(date).toISOString().split('T')[0]
      );
      
      if (dayRecords.length === 0) return;

      const dateStr = new Date(date).toLocaleDateString();
      const element = document.createElement('div');
      element.innerHTML = `
        <div class="p-4">
          <h2 class="text-xl font-bold mb-4">Registro de Asistencia - ${dateStr}</h2>
          <div class="mb-4">
            <h3 class="font-medium">Datos del Encargado:</h3>
            <p>Área: ${getAssignedArea()}</p>
            <p>Turno: ${getAssignedTurnoLabel()}</p>
          </div>
          <table class="w-full border-collapse border">
            <thead>
              <tr>
                <th class="border p-2">Trabajador</th>
                <th class="border p-2">Estado</th>
                <th class="border p-2">Observación</th>
              </tr>
            </thead>
            <tbody>
              ${dayRecords.map(r => `
                <tr>
                  <td class="border p-2">${r.worker.name}</td>
                  <td class="border p-2">${getStatusLabel(r.status)}</td>
                  <td class="border p-2">${r.observation}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      const opt = {
        margin: 1,
        filename: `asistencia-${dateStr}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      try {
        window.showToast('Generando PDF...', 'info');
        await html2pdf().set(opt).from(element).save();
        window.showToast('PDF generado exitosamente', 'success');
      } catch (error) {
        console.error('Error generating PDF:', error);
        window.showToast('Error al generar PDF', 'error');
      }
    }

    function getAssignedAreaForPeriod(period) {
      const a = findEncargadoAssignment(period, userId.value);
      return a ? a.area : 'No asignado';
    }

    function getAssignedTurnoLabelForPeriod(period) {
      const a = findEncargadoAssignment(period, userId.value);
      if (!a || !a.turno) return 'No asignado';
      return Number(a.turno) === 1 ? 'Día' : 'Noche';
    }

    async function exportPeriodPDF(period) {
      // Get all attendance records for this period
      const periodAttendances = attendanceRecords.value.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= new Date(period.startDate) && recordDate <= new Date(period.endDate) && r.finalized;
      });

      if (periodAttendances.length === 0) return;

      const periodStr = `${new Date(period.startDate).toLocaleDateString()} - ${new Date(period.endDate).toLocaleDateString()}`;
      const element = document.createElement('div');
      element.innerHTML = `
        <div class="p-4">
          <h2 class="text-xl font-bold mb-4">Registro de Asistencia - Periodo ${periodStr}</h2>
          <div class="mb-4">
            <h3 class="font-medium">Datos del Encargado:</h3>
            <p>Área: ${getAssignedAreaForPeriod(period)}</p>
            <p>Turno: ${getAssignedTurnoLabelForPeriod(period)}</p>
          </div>
          <table class="w-full border-collapse border">
            <thead>
              <tr>
                <th class="border p-2">Fecha</th>
                <th class="border p-2">Trabajador</th>
                <th class="border p-2">Estado</th>
                <th class="border p-2">Observación</th>
              </tr>
            </thead>
            <tbody>
              ${periodAttendances.map(r => `
                <tr>
                  <td class="border p-2">${new Date(r.date).toLocaleDateString()}</td>
                  <td class="border p-2">${r.worker ? r.worker.name : 'Trabajador desconocido'}</td>
                  <td class="border p-2">${getStatusLabel(r.status)}</td>
                  <td class="border p-2">${r.observation}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      const opt = {
        margin: 1,
        filename: `asistencia-periodo-${periodStr.replace(/\//g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      try {
        window.showToast('Generando PDF...', 'info');
        await html2pdf().set(opt).from(element).save();
        window.showToast('PDF generado exitosamente', 'success');
      } catch (error) {
        console.error('Error generating PDF:', error);
        window.showToast('Error al generar PDF', 'error');
      }
    }

    return {
      workers,
      currentAssignment,
      userId,
      attendanceRecords,
      attendance,
      markForWorker,
      markAllPresent,
      finalizeAttendance,
      getAssignedArea,
      getAssignedTurnoLabel,
      selectedDay,
      assignmentDays,
      selectDay,
      allDaysFinalized,
      getAttendanceForDay,
      showPeriodHistory,
      finalizedPeriods,
      finalizePeriod,
      exportSingleDayPDF,
      exportToPDF,
      getStatusLabel,
      getAssignedAreaForPeriod,
      getAssignedTurnoLabelForPeriod,
      exportPeriodPDF
    };
  }
};
</script>
