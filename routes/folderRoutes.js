// routes/folderRoutes.js
const express = require('express');
const { createFolder, listFolderContents, renameFolder, deleteFolder } = require('../controllers/folderController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Rutas protegidas para gestión de carpetas
router.post('/', protect, createFolder); // Crear una nueva carpeta
router.get('/:folderId', protect, listFolderContents); // Listar contenido de una carpeta
router.put('/:folderId/rename', protect, renameFolder); // Renombrar una carpeta
router.delete('/:folderId', protect, deleteFolder); // Eliminar una carpeta

module.exports = router;
