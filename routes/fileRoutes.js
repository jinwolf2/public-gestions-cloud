// routes/fileRoutes.js
const express = require('express');
const {
    uploadFile,
    downloadFile,
    renameFile,
    createFolder,
    deleteFile,
    deleteFolder,
    listFiles,
    moveFile,
    renameFolder,
    moveFolder,
    uploadFolder
} = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');



// Configuración de Multer
// routes/fileRoutes.js
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // La carpeta base del usuario
        const userBasePath = path.join(BASE_STORAGE_PATH, req.user.username);

        // La ruta relativa del archivo
        const relativePath = path.dirname(file.originalname);

        // Ruta completa donde se guardará el archivo
        const fullPath = path.join(userBasePath, relativePath);

        // Crear el directorio si no existe
        fs.mkdirSync(fullPath, { recursive: true });
        cb(null, fullPath);
    },
    filename: function (req, file, cb) {
        // Obtener el nombre del archivo
        const originalFileName = path.basename(file.originalname);

        // Preservar el nombre del archivo y manejar duplicados
        let filename = originalFileName;
        let fullPath = path.join(file.destination, filename);

        let counter = 1;
        while (fs.existsSync(fullPath)) {
            const extension = path.extname(filename);
            const basename = path.basename(originalFileName, extension);
            filename = `${basename} (${counter})${extension}`;
            fullPath = path.join(file.destination, filename);
            counter++;
        }

        cb(null, filename);
    },
});


const upload = multer({ storage });

const router = express.Router();

router.post('/upload', protect, upload.single('file'), uploadFile);
router.get('/download/:id', protect, downloadFile);
router.put('/rename/:id', protect, renameFile);
router.post('/create-folder', protect, createFolder);
router.delete('/delete-file/:id', protect, deleteFile);
router.delete('/delete-folder/:id', protect, deleteFolder);
router.get('/list', protect, listFiles);
router.put('/move-file/:id', protect, moveFile);
router.put('/rename-folder/:id', protect, renameFolder);
router.put('/move-folder/:id', protect, moveFolder);
router.post('/upload-folder', protect, uploadFolder);

module.exports = router;
