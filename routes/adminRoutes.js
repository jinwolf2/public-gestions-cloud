// routes/adminRoutes.js
const express = require('express');
const { createUser, getAllUsers, updateDiskSpace } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/roleMiddleware');

const router = express.Router();

// Rutas protegidas y solo accesibles por administradores
router.post('/users', protect, admin, createUser); // Crear usuario
router.get('/users', protect, admin, getAllUsers); // Obtener todos los usuarios
router.put('/users/:id/disk-space', protect, admin, updateDiskSpace); // Actualizar tamaño de disco

module.exports = router;
