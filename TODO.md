# TODO: Implementar Finalización de Periodo y Historial de Periodos

## Backend Changes
- [ ] Actualizar modelo Assignment.js: agregar campo `finalized` (Boolean, default false)
- [ ] En adminController.js: agregar función `finalizePeriod` para marcar assignment actual como finalizado
- [ ] En routes/admin.js: agregar ruta POST `/finalize-period` para encargados
- [ ] En adminController.js: agregar función `getFinalizedPeriods` para obtener periodos finalizados del encargado

## Frontend Changes
- [x] REMOVED: Computed `allDaysFinalized` eliminado por problemas en el proyecto
- [x] REMOVED: Botón "Finalizar periodo" eliminado por problemas en el proyecto
- [x] REMOVED: Método `finalizePeriod` eliminado por problemas en el proyecto
- [ ] Mantener función `finalizeAttendance` para finalizar asistencia diaria (no periodo completo)
- [ ] Cambiar título "Historial de Asistencias" a "Historial de Periodos"
- [ ] Reemplazar lógica de historial de asistencias individuales por historial de periodos finalizados
- [ ] Agregar `filteredPeriods` computed para mostrar periodos finalizados
- [ ] Actualizar template para mostrar lista de periodos en lugar de registros individuales
- [ ] Agregar funcionalidad para mostrar nueva asignación si existe después de finalizar

## Testing
- [ ] Probar flujo completo: marcar todos los días, finalizar periodo, verificar historial
- [ ] Verificar que no se muestre el periodo finalizado en la vista principal
- [ ] Confirmar que nueva asignación se muestre correctamente
