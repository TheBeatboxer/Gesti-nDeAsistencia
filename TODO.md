# TODO: Implementar Finalización de Periodo y Historial de Periodos

## Backend Changes
- [ ] Actualizar modelo Assignment.js: agregar campo `finalized` (Boolean, default false)
- [ ] En adminController.js: agregar función `finalizePeriod` para marcar assignment actual como finalizado
- [ ] En routes/admin.js: agregar ruta POST `/finalize-period` para encargados
- [ ] En adminController.js: agregar función `getFinalizedPeriods` para obtener periodos finalizados del encargado

## Frontend Changes
- [ ] En EncargadoPanel.vue: agregar computed `allDaysFinalized` para verificar si todos los días están finalizados
- [ ] Agregar botón "Finalizar periodo" cuando todos los días estén finalizados y el periodo no esté finalizado
- [ ] Agregar método `finalizePeriod` para llamar a la API y finalizar el periodo
- [ ] Cambiar título "Historial de Asistencias" a "Historial de Periodos"
- [ ] Reemplazar lógica de historial de asistencias individuales por historial de periodos finalizados
- [ ] Agregar `filteredPeriods` computed para mostrar periodos finalizados
- [ ] Actualizar template para mostrar lista de periodos en lugar de registros individuales
- [ ] Agregar funcionalidad para mostrar nueva asignación si existe después de finalizar

## Testing
- [ ] Probar flujo completo: marcar todos los días, finalizar periodo, verificar historial
- [ ] Verificar que no se muestre el periodo finalizado en la vista principal
- [ ] Confirmar que nueva asignación se muestre correctamente
