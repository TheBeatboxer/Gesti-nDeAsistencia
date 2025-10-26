# TODO: Fix Encargado Panel for Worker Assignments

## Tasks
- [ ] Add 'turno' field to User model (backend/src/models/User.js)
- [ ] Update seed script to create 40 workers: 10 per area (Manufactura, Envasado) per turno (1=day, 2=night)
- [ ] Modify getWorkers in adminController.js to filter workers by both area and turno for encargados
- [ ] Test EncargadoPanel.vue to ensure only assigned workers are displayed
- [ ] Create a current week assignment for testing
- [ ] Verify attendance marking works for assigned workers only
