# TODO: Mejorar Responsividad del Proyecto

## Información Recopilada
- El proyecto usa Tailwind CSS con breakpoints básicos (sm, md, lg, xl).
- Componentes principales: App.vue, Header.vue, AdminDashboard.vue, UserManagement.vue, WorkerDashboard.vue, EncargadoPanel.vue.
- Ya hay algunos ajustes responsivos, pero limitados a sm y md; falta optimización para tablets, laptops y pantallas grandes.
- App.vue limita ancho a max-w-screen-md, restringiendo pantallas grandes.
- Header.vue tiene botón de menú sin funcionalidad para móviles.
- Grids y paddings necesitan ajustes para más breakpoints.

## Plan
1. **Actualizar App.vue**: Cambiar max-width para aprovechar pantallas grandes, ajustar paddings responsivos.
2. **Mejorar Header.vue**: Agregar funcionalidad al botón de menú para móviles (mostrar/ocultar menú).
3. **Optimizar AdminDashboard.vue**: Ajustar grids, paddings y tamaños de fuente para múltiples breakpoints.
4. **Optimizar UserManagement.vue**: Mejorar layout de formularios y tablas para responsividad.
5. **Optimizar WorkerDashboard.vue**: Ajustar paddings y tablas.
6. **Optimizar EncargadoPanel.vue**: Refinar grids y elementos para pantallas grandes.
7. **Extender Tailwind config**: Agregar breakpoints personalizados si es necesario (e.g., xl para pantallas extra grandes).

## Archivos Dependientes
- frontend/src/App.vue
- frontend/src/components/Header.vue
- frontend/src/components/AdminDashboard.vue
- frontend/src/components/UserManagement.vue
- frontend/src/components/WorkerDashboard.vue
- frontend/src/components/EncargadoPanel.vue
- frontend/tailwind.config.js

## Pasos de Seguimiento
- [x] Actualizar App.vue para max-width y paddings.
- [x] Agregar funcionalidad de menú móvil en Header.vue.
- [x] Ajustar AdminDashboard.vue para grids y responsividad.
- [x] Ajustar UserManagement.vue para formularios y tablas.
- [x] Ajustar WorkerDashboard.vue para paddings y tablas.
- [x] Ajustar EncargadoPanel.vue para grids y elementos.
- [x] Extender Tailwind config si es necesario.
- [x] Probar en diferentes dispositivos (móvil, tablet, laptop, desktop).

## Seguimiento Post-Edición
- Ejecutar `npm run dev` en frontend para probar cambios.
- Verificar en navegador con herramientas de desarrollo para diferentes tamaños de pantalla.
- Ajustar si hay problemas de overflow o layout.
