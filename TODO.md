# Update Sistema de Asistencia to use turno as string ('dia'/'noche') instead of numbers (1/2)

## Models
- [x] Update backend/src/models/Assignment.js: Change turno from Number enum [1,2] to String enum ['dia','noche']
- [x] Update backend/src/models/Attendance.js: Change turno from Number enum [1,2] to String enum ['dia','noche']

## Controllers
- [x] Update backend/src/controllers/authController.js: Change default turno from 1 to 'dia'
- [x] Update backend/src/controllers/adminController.js: Update turno logic to use strings
- [x] Update backend/src/controllers/attendanceController.js: Update turno logic to use strings
- [x] Update backend/src/controllers/userController.js: Ensure turno handling as string

## Scripts
- [x] Update backend/src/scripts/seed.js: Change turno values to 'dia'/'noche'
- [x] Update backend/scripts/seed.js: Change turno values to 'dia'/'noche'

## Testing
- [x] Run seed script to verify data creation
- [ ] Test authentication and user creation
- [ ] Test assignment creation and retrieval
- [ ] Test attendance marking and reporting

# Update Sistema de Asistencia to use areas 'Area 1' and 'Area 2' only, and User model fields: name, email, password, role, area, codigo, turno

## Models
- [x] Update backend/src/models/User.js: Change area enum to ['Area 1', 'Area 2'], remove 'linea' and 'puesto' fields
- [x] Update backend/src/models/Assignment.js: Change area enum to ['Area 1', 'Area 2']
- [x] Update backend/src/models/Attendance.js: Change area enum to ['Area 1', 'Area 2']

## Controllers
- [x] Update backend/src/controllers/userController.js: Remove handling of 'linea' and 'puesto' in createUser, updateUser, and response fields

## Scripts
- [x] Update backend/scripts/seed.js: Change areas in seed data to 'Area 1' and 'Area 2'

## Testing
- [ ] Run seed script to update existing data
- [ ] Test user creation and updates
- [ ] Test assignments and attendance with new areas
