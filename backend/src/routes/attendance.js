// src/routes/attendance.js
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

router.post('/mark', authMiddleware, authorizeRoles('ENCARGADO','ADMIN'), attendanceController.markAttendance);
router.get('/report', authMiddleware, authorizeRoles('ADMIN','ENCARGADO','WORKER'), attendanceController.getAttendanceReport);

module.exports = router;
