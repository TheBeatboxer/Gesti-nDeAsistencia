// src/routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

router.post('/assignment', authMiddleware, authorizeRoles('ADMIN'), adminController.createOrUpdateAssignment);
router.get('/assignment/:weekStart', authMiddleware, authorizeRoles('ADMIN','ENCARGADO'), adminController.getAssignmentForWeek);
router.get('/assignment/current', authMiddleware, authorizeRoles('ADMIN','ENCARGADO'), adminController.getCurrentAssignment);
router.post('/assignment/rotate', authMiddleware, authorizeRoles('ADMIN'), adminController.rotateAssignments);

router.get('/workers', authMiddleware, authorizeRoles('ADMIN','ENCARGADO'), adminController.getWorkers);
router.get('/encargados', authMiddleware, authorizeRoles('ADMIN'), adminController.getEncargados);

module.exports = router;
