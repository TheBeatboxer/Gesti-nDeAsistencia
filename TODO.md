# TODO: Implementar Asignaciones por Intervalo de Fechas

## Tasks
- [ ] Cambiar modelo Assignment: renombrar weekStart a startDate, actualizar índice único
- [ ] Actualizar adminController.js: modificar createOrUpdateAssignment para usar startDate sin normalización, actualizar getCurrentAssignment para buscar por intervalo de fechas
- [ ] Actualizar EncargadoPanel.vue: cambiar lógica para encontrar asignación actual basada en intervalo de fechas
- [ ] Actualizar attendanceController.js: modificar verificación de asignación para fechas dentro del intervalo
- [ ] Actualizar AdminDashboard.vue: cambiar formulario para usar startDate y endDate
- [ ] Probar creación de asignación y visualización en panel de Encargado
- [ ] Verificar marcación de asistencia solo para fechas en el intervalo asignado

## Timezone Fix
- [x] Instalar moment-timezone en backend
- [x] Actualizar dateUtils.js para usar America/Lima timezone
- [x] Actualizar normalizeDate en adminController.js para usar America/Lima
- [x] Actualizar normalizeDate en attendanceController.js para usar America/Lima
- [x] Establecer TZ en server.js a America/Lima
- [x] Instalar moment-timezone en frontend
- [x] Establecer default timezone en main.js a America/Lima
