// controllers/folderController.js
const Folder = require('../models/Folder');
const path = require('path');
const fs = require('fs');

const { BASE_STORAGE_PATH } = require('../config/storageConfig');

// Función para crear una carpeta
exports.createFolder = async (req, res) => {
    const { folderName, parentId } = req.body;

    try {
        // Validar que se proporcione el nombre de la carpeta
        if (!folderName) {
            return res.status(400).json({ message: 'El nombre de la carpeta es obligatorio' });
        }

        // Determinar la ruta de la nueva carpeta
        let parentFolder = null;
        let newFolderPath = path.join(BASE_STORAGE_PATH, req.user.username);

        if (parentId) {
            parentFolder = await Folder.findById(parentId);
            if (!parentFolder) {
                return res.status(404).json({ message: 'Carpeta padre no encontrada' });
            }

            // Verificar que la carpeta padre pertenece al usuario
            if (parentFolder.owner.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'No tienes permisos para acceder a esta carpeta' });
            }

            newFolderPath = path.join(parentFolder.path, folderName);
        } else {
            // Carpeta raíz del usuario
            newFolderPath = path.join(__dirname, '..', 'uploads', req.user.username, folderName);
        }

        // Verificar si la carpeta ya existe en la base de datos
        const existingFolder = await Folder.findOne({ owner: req.user._id, path: newFolderPath });
        if (existingFolder) {
            return res.status(400).json({ message: 'La carpeta ya existe' });
        }

        // Crear la carpeta en el sistema de archivos
        fs.mkdirSync(newFolderPath, { recursive: true });

        // Crear registro de la carpeta en la base de datos
        const newFolder = await Folder.create({
            name: folderName,
            owner: req.user._id,
            parent: parentId || null,
            path: newFolderPath,
        });

        res.status(201).json(newFolder);
    } catch (error) {
        console.error('Error al crear la carpeta:', error);
        res.status(500).json({ message: 'Error al crear la carpeta' });
    }
};

// Función para listar carpetas y archivos dentro de una carpeta
exports.listFolderContents = async (req, res) => {
    const { folderId } = req.params;

    try {
        let folder = null;
        let folderPath = path.join(__dirname, '..', 'uploads', req.user.username);

        if (folderId !== 'root') {
            folder = await Folder.findById(folderId);
            if (!folder) {
                return res.status(404).json({ message: 'Carpeta no encontrada' });
            }

            // Verificar que la carpeta pertenece al usuario
            if (folder.owner.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'No tienes permisos para acceder a esta carpeta' });
            }

            folderPath = folder.path;
        }

        // Obtener subcarpetas
        const subFolders = await Folder.find({ owner: req.user._id, parent: folderId !== 'root' ? folderId : null });

        // Obtener archivos en la carpeta actual
        const files = await File.find({ owner: req.user._id, folder: folderId !== 'root' ? folderId : null });

        res.json({
            folder: folderId === 'root' ? 'root' : folder,
            subFolders,
            files,
        });
    } catch (error) {
        console.error('Error al listar el contenido de la carpeta:', error);
        res.status(500).json({ message: 'Error al listar el contenido de la carpeta' });
    }
};


// controllers/folderController.js
// Añadir al final del archivo
exports.renameFolder = async (req, res) => {
    const { folderId } = req.params;
    const { newName } = req.body;

    try {
        // Validar que se proporcione el nuevo nombre
        if (!newName) {
            return res.status(400).json({ message: 'El nuevo nombre de la carpeta es obligatorio' });
        }

        // Encontrar la carpeta
        const folder = await Folder.findById(folderId);
        if (!folder) {
            return res.status(404).json({ message: 'Carpeta no encontrada' });
        }

        // Verificar que la carpeta pertenece al usuario
        if (folder.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'No tienes permisos para renombrar esta carpeta' });
        }

        // Determinar la nueva ruta
        const parentPath = folder.parent ? (await Folder.findById(folder.parent)).path : path.join(__dirname, '..', 'uploads', req.user.username);
        const newFolderPath = path.join(parentPath, newName);

        // Verificar si la carpeta con el nuevo nombre ya existe
        const existingFolder = await Folder.findOne({ owner: req.user._id, path: newFolderPath });
        if (existingFolder) {
            return res.status(400).json({ message: 'Ya existe una carpeta con este nombre en la ubicación especificada' });
        }

        // Renombrar la carpeta en el sistema de archivos
        fs.renameSync(folder.path, newFolderPath);

        // Actualizar la ruta en la base de datos
        folder.name = newName;
        folder.path = newFolderPath;
        await folder.save();

        res.json(folder);
    } catch (error) {
        console.error('Error al renombrar la carpeta:', error);
        res.status(500).json({ message: 'Error al renombrar la carpeta' });
    }
};

// controllers/folderController.js
// Añadir al final del archivo
exports.deleteFolder = async (req, res) => {
    const { folderId } = req.params;

    try {
        // Encontrar la carpeta
        const folder = await Folder.findById(folderId);
        if (!folder) {
            return res.status(404).json({ message: 'Carpeta no encontrada' });
        }

        // Verificar que la carpeta pertenece al usuario
        if (folder.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'No tienes permisos para eliminar esta carpeta' });
        }

        // Verificar que la carpeta esté vacía
        const subFolders = await Folder.find({ parent: folderId });
        const files = await File.find({ folder: folderId });

        if (subFolders.length > 0 || files.length > 0) {
            return res.status(400).json({ message: 'La carpeta no está vacía' });
        }

        // Eliminar la carpeta del sistema de archivos
        fs.rmdirSync(folder.path);

        // Eliminar la carpeta de la base de datos
        await folder.remove();

        res.json({ message: 'Carpeta eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar la carpeta:', error);
        res.status(500).json({ message: 'Error al eliminar la carpeta' });
    }
};
