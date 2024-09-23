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
} = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { BASE_STORAGE_PATH } = require('../config/storageConfig');

// Configuración de Multer
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        let folderPath = path.join(BASE_STORAGE_PATH, req.user.username);

        if (req.body.folderId) {
            const folder = await Folder.findOne({ _id: req.body.folderId, owner: req.user._id });
            if (!folder) {
                return cb(new Error('Carpeta no encontrada'));
            }
            folderPath = folder.path;
        }

        fs.mkdirSync(folderPath, { recursive: true });
        cb(null, folderPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
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

module.exports = router;
