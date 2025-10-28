// src/routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

// Primero las rutas específicas
router.get('/assignment/current', authMiddleware, authorizeRoles('ADMIN','ENCARGADO'), adminController.getCurrentAssignment);
router.get('/assignments', authMiddleware, authorizeRoles('ADMIN'), adminController.getAllAssignments);

// Luego las rutas con parámetros
router.post('/assignment', authMiddleware, authorizeRoles('ADMIN'), adminController.createOrUpdateAssignment);
router.get('/assignment/:date', authMiddleware, authorizeRoles('ADMIN','ENCARGADO'), adminController.getAssignmentForDate);
router.delete('/assignment/:id', authMiddleware, authorizeRoles('ADMIN'), adminController.deleteAssignment);

router.post('/finalize-period', authMiddleware, authorizeRoles('ENCARGADO','ADMIN'), adminController.finalizePeriod);
router.get('/finalized-periods', authMiddleware, authorizeRoles('ENCARGADO','ADMIN'), adminController.getFinalizedPeriods);

router.get('/workers', authMiddleware, authorizeRoles('ADMIN','ENCARGADO'), adminController.getWorkers);
router.get('/encargados', authMiddleware, authorizeRoles('ADMIN'), adminController.getEncargados);

module.exports = router;
