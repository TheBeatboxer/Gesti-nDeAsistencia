// src/routes/auth.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

router.post('/register', [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
], authController.register);

router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty()
], authController.login);

// User management routes
router.post('/users', authMiddleware, authorizeRoles('ADMIN'), userController.createUser);
router.get('/users', authMiddleware, authorizeRoles('ADMIN'), userController.listAll);
router.get('/users/:id', authMiddleware, authorizeRoles('ADMIN'), userController.getById);
router.put('/users/:id', authMiddleware, authorizeRoles('ADMIN'), userController.updateUser);
router.delete('/users/:id', authMiddleware, authorizeRoles('ADMIN'), userController.deleteUser);

module.exports = router;
