// controllers/fileController.js

const File = require('../models/File');
const Folder = require('../models/Folder');
const path = require('path');
const fs = require('fs');
const { BASE_STORAGE_PATH } = require('../config/storageConfig');

// Función para crear una carpeta
exports.createFolder = async (req, res) => {
    const { folderName, parentId } = req.body;

    try {
        if (!folderName) {
            return res.status(400).json({ message: 'El nombre de la carpeta es obligatorio' });
        }

        let parentFolder = null;
        let folderPath = path.join(__dirname, '..', 'uploads', req.user.username);

        if (parentId) {
            parentFolder = await Folder.findOne({ _id: parentId, owner: req.user._id });
            if (!parentFolder) {
                return res.status(404).json({ message: 'Carpeta padre no encontrada' });
            }
            folderPath = parentFolder.path;
        }

        const newFolderPath = path.join(folderPath, folderName);

        // Verificar si la carpeta ya existe
        if (fs.existsSync(newFolderPath)) {
            return res.status(400).json({ message: 'La carpeta ya existe' });
        }

        // Crear la carpeta en el sistema de archivos
        fs.mkdirSync(newFolderPath);

        // Crear la carpeta en la base de datos
        const newFolder = await Folder.create({
            name: folderName,
            owner: req.user._id,
            parent: parentFolder ? parentFolder._id : null,
            path: newFolderPath,
        });

        res.status(201).json(newFolder);
    } catch (error) {
        console.error('Error al crear la carpeta:', error);
        res.status(500).json({ message: 'Error al crear la carpeta' });
    }
};

// Función para subir un archivo
exports.uploadFile = async (req, res) => {
    try {
        const file = req.file;
        const { folderName } = req.body;

        if (!file) {
            return res.status(400).json({ message: 'No se ha subido ningún archivo' });
        }

        // Obtener la carpeta donde se subirá el archivo
        let folder = null;
        let folderPath = path.join(__dirname, '..', 'uploads', req.user.username);

        if (folderName) {
            folder = await Folder.findOne({ name: folderName, owner: req.user._id });
            if (!folder) {
                // Eliminar el archivo subido temporalmente
                fs.unlinkSync(file.path);
                return res.status(404).json({ message: 'Carpeta no encontrada' });
            }
            folderPath = folder.path;
        }

        // Verificar el espacio disponible
        const user = req.user;
        if (user.usedSpace + file.size > user.diskSpace) {
            // Eliminar el archivo subido temporalmente
            fs.unlinkSync(file.path);
            return res.status(400).json({ message: 'Espacio de disco insuficiente' });
        }

        // Preservar el nombre original del archivo y manejar duplicados
        let filename = file.originalname;
        let filePath = path.join(folderPath, filename);

        let counter = 1;
        while (fs.existsSync(filePath)) {
            const extension = path.extname(filename);
            const basename = path.basename(filename, extension);
            filename = `${basename} (${counter})${extension}`;
            filePath = path.join(folderPath, filename);
            counter++;
        }

        // Mover el archivo al destino final
        fs.renameSync(file.path, filePath);

        // Crear registro en la base de datos
        const newFile = await File.create({
            filename: filename,
            originalName: file.originalname,
            path: filePath,
            size: file.size,
            owner: user._id,
            folder: folder ? folder._id : null,
        });

        // Actualizar el espacio usado
        user.usedSpace += file.size;
        await user.save();

        res.status(201).json(newFile);
    } catch (error) {
        console.error('Error al subir el archivo:', error);
        res.status(500).json({ message: 'Error al subir el archivo' });
    }
};


// Función para descargar un archivo
exports.downloadFile = async (req, res) => {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({ message: 'Archivo no encontrado' });
        }

        if (file.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'No tienes permisos para descargar este archivo' });
        }

        res.download(file.path, file.originalName);
    } catch (error) {
        console.error('Error al descargar el archivo:', error);
        res.status(500).json({ message: 'Error al descargar el archivo' });
    }
};

// Renombrar un archivo
exports.renameFile = async (req, res) => {
    const { newName } = req.body;
    const { id } = req.params;

    try {
        if (!newName) {
            return res.status(400).json({ message: 'El nuevo nombre del archivo es obligatorio' });
        }

        const file = await File.findById(id);
        if (!file) {
            return res.status(404).json({ message: 'Archivo no encontrado' });
        }

        if (file.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'No tienes permisos para renombrar este archivo' });
        }

        const oldPath = file.path;
        const newPath = path.join(path.dirname(oldPath), newName);

        // Verificar si un archivo o carpeta con el nuevo nombre ya existe
        if (fs.existsSync(newPath)) {
            return res.status(400).json({ message: 'Ya existe un archivo o carpeta con este nombre en la carpeta' });
        }

        // Renombrar el archivo en el sistema de archivos
        fs.renameSync(oldPath, newPath);

        // Actualizar los datos del archivo en la base de datos
        file.filename = newName;
        file.originalName = newName;
        file.path = newPath;
        await file.save();

        res.json(file);
    } catch (error) {
        console.error('Error al renombrar el archivo:', error);
        res.status(500).json({ message: 'Error al renombrar el archivo' });
    }
};

// Eliminar un archivo
exports.deleteFile = async (req, res) => {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({ message: 'Archivo no encontrado' });
        }

        if (file.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'No tienes permisos para eliminar este archivo' });
        }

        // Eliminar el archivo del sistema de archivos
        fs.unlinkSync(file.path);

        // Actualizar el espacio usado
        req.user.usedSpace -= file.size;
        await req.user.save();

        // Eliminar el registro del archivo en la base de datos
        await file.remove();

        res.json({ message: 'Archivo eliminado' });
    } catch (error) {
        console.error('Error al eliminar el archivo:', error);
        res.status(500).json({ message: 'Error al eliminar el archivo' });
    }
};

// Listar archivos y carpetas
exports.listFiles = async (req, res) => {
    const { folderId } = req.query;

    try {
        let folder = null;
        if (folderId) {
            folder = await Folder.findOne({ _id: folderId, owner: req.user._id });
            if (!folder) {
                return res.status(404).json({ message: 'Carpeta no encontrada' });
            }
        }

        // Obtener subcarpetas y archivos en la carpeta actual
        const folders = await Folder.find({
            owner: req.user._id,
            parent: folder ? folder._id : null,
        });

        const files = await File.find({
            owner: req.user._id,
            folder: folder ? folder._id : null,
        });

        res.json({ folders, files });
    } catch (error) {
        console.error('Error al listar los archivos y carpetas:', error);
        res.status(500).json({ message: 'Error al listar los archivos y carpetas' });
    }
};

// Mover un archivo a otra carpeta
exports.moveFile = async (req, res) => {
    const { destinationFolderId } = req.body;
    const { id } = req.params;

    try {
        const file = await File.findById(id);
        if (!file) {
            return res.status(404).json({ message: 'Archivo no encontrado' });
        }

        if (file.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'No tienes permisos para mover este archivo' });
        }

        let destinationFolder = null;
        let destinationPath = path.join(__dirname, '..', 'uploads', req.user.username);

        if (destinationFolderId) {
            destinationFolder = await Folder.findOne({ _id: destinationFolderId, owner: req.user._id });
            if (!destinationFolder) {
                return res.status(404).json({ message: 'Carpeta de destino no encontrada' });
            }
            destinationPath = destinationFolder.path;
        }

        const newPath = path.join(destinationPath, file.filename);

        // Verificar si un archivo con el mismo nombre ya existe en la carpeta de destino
        if (fs.existsSync(newPath)) {
            return res.status(400).json({ message: 'Ya existe un archivo con este nombre en la carpeta de destino' });
        }

        // Mover el archivo en el sistema de archivos
        fs.renameSync(file.path, newPath);

        // Actualizar los datos del archivo en la base de datos
        file.path = newPath;
        file.folder = destinationFolder ? destinationFolder._id : null;
        await file.save();

        res.json(file);
    } catch (error) {
        console.error('Error al mover el archivo:', error);
        res.status(500).json({ message: 'Error al mover el archivo' });
    }
};

// Eliminar una carpeta y su contenido
exports.deleteFolder = async (req, res) => {
    const { id } = req.params;

    try {
        const folder = await Folder.findById(id);
        if (!folder) {
            return res.status(404).json({ message: 'Carpeta no encontrada' });
        }

        if (folder.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'No tienes permisos para eliminar esta carpeta' });
        }

        // Función recursiva para eliminar carpetas y archivos
        const deleteFolderRecursively = async (folder) => {
            const subfolders = await Folder.find({ owner: req.user._id, parent: folder._id });
            for (const subfolder of subfolders) {
                await deleteFolderRecursively(subfolder);
            }

            const files = await File.find({ owner: req.user._id, folder: folder._id });
            for (const file of files) {
                // Eliminar el archivo del sistema de archivos
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
                // Actualizar el espacio usado
                req.user.usedSpace -= file.size;
                await file.remove();
            }

            // Eliminar la carpeta del sistema de archivos
            if (fs.existsSync(folder.path)) {
                fs.rmdirSync(folder.path);
            }

            // Eliminar la carpeta de la base de datos
            await folder.remove();
        };

        await deleteFolderRecursively(folder);

        // Guardar cambios en el usuario
        await req.user.save();

        res.json({ message: 'Carpeta eliminada' });
    } catch (error) {
        console.error('Error al eliminar la carpeta:', error);
        res.status(500).json({ message: 'Error al eliminar la carpeta' });
    }
};

// Renombrar una carpeta
exports.renameFolder = async (req, res) => {
    const { newName } = req.body;
    const { id } = req.params;

    try {
        if (!newName) {
            return res.status(400).json({ message: 'El nuevo nombre de la carpeta es obligatorio' });
        }

        const folder = await Folder.findById(id);
        if (!folder) {
            return res.status(404).json({ message: 'Carpeta no encontrada' });
        }

        if (folder.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'No tienes permisos para renombrar esta carpeta' });
        }

        const oldPath = folder.path;
        const newPath = path.join(path.dirname(oldPath), newName);

        // Verificar si una carpeta o archivo con el nuevo nombre ya existe
        if (fs.existsSync(newPath)) {
            return res.status(400).json({ message: 'Ya existe una carpeta o archivo con este nombre en la carpeta' });
        }

        // Renombrar la carpeta en el sistema de archivos
        fs.renameSync(oldPath, newPath);

        // Actualizar la ruta de la carpeta y de todos sus contenidos en la base de datos
        const updatePathsRecursively = async (folder, oldBasePath, newBasePath) => {
            const subfolders = await Folder.find({ owner: req.user._id, parent: folder._id });
            for (const subfolder of subfolders) {
                const subfolderOldPath = subfolder.path;
                const subfolderNewPath = subfolderOldPath.replace(oldBasePath, newBasePath);
                subfolder.path = subfolderNewPath;
                await subfolder.save();
                await updatePathsRecursively(subfolder, oldBasePath, newBasePath);
            }

            const files = await File.find({ owner: req.user._id, folder: folder._id });
            for (const file of files) {
                const fileOldPath = file.path;
                const fileNewPath = fileOldPath.replace(oldBasePath, newBasePath);
                file.path = fileNewPath;
                await file.save();
            }
        };

        folder.name = newName;
        folder.path = newPath;
        await folder.save();

        await updatePathsRecursively(folder, oldPath, newPath);

        res.json(folder);
    } catch (error) {
        console.error('Error al renombrar la carpeta:', error);
        res.status(500).json({ message: 'Error al renombrar la carpeta' });
    }
};

// Mover una carpeta a otra ubicación
exports.moveFolder = async (req, res) => {
    const { destinationFolderId } = req.body;
    const { id } = req.params;

    try {
        const folder = await Folder.findById(id);
        if (!folder) {
            return res.status(404).json({ message: 'Carpeta no encontrada' });
        }

        if (folder.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'No tienes permisos para mover esta carpeta' });
        }

        let destinationFolder = null;
        let destinationPath = path.join(__dirname, '..', 'uploads', req.user.username);

        if (destinationFolderId) {
            destinationFolder = await Folder.findOne({ _id: destinationFolderId, owner: req.user._id });
            if (!destinationFolder) {
                return res.status(404).json({ message: 'Carpeta de destino no encontrada' });
            }
            destinationPath = destinationFolder.path;
        }

        const newPath = path.join(destinationPath, folder.name);

        // Verificar si una carpeta o archivo con el mismo nombre ya existe en la carpeta de destino
        if (fs.existsSync(newPath)) {
            return res.status(400).json({ message: 'Ya existe una carpeta o archivo con este nombre en la carpeta de destino' });
        }

        // Mover la carpeta en el sistema de archivos
        fs.renameSync(folder.path, newPath);

        // Actualizar la ruta de la carpeta y de todos sus contenidos en la base de datos
        const updatePathsRecursively = async (folder, oldBasePath, newBasePath) => {
            const subfolders = await Folder.find({ owner: req.user._id, parent: folder._id });
            for (const subfolder of subfolders) {
                const subfolderOldPath = subfolder.path;
                const subfolderNewPath = subfolderOldPath.replace(oldBasePath, newBasePath);
                subfolder.path = subfolderNewPath;
                await subfolder.save();
                await updatePathsRecursively(subfolder, oldBasePath, newBasePath);
            }

            const files = await File.find({ owner: req.user._id, folder: folder._id });
            for (const file of files) {
                const fileOldPath = file.path;
                const fileNewPath = fileOldPath.replace(oldBasePath, newBasePath);
                file.path = fileNewPath;
                await file.save();
            }
        };

        const oldPath = folder.path;

        folder.path = newPath;
        folder.parent = destinationFolder ? destinationFolder._id : null;
        await folder.save();

        await updatePathsRecursively(folder, oldPath, newPath);

        res.json(folder);
    } catch (error) {
        console.error('Error al mover la carpeta:', error);
        res.status(500).json({ message: 'Error al mover la carpeta' });
    }
};

exports.uploadFolder = async (req, res) => {
    try {
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ message: 'No se han subido archivos' });
        }

        const user = req.user;
        let totalSize = 0;
        const uploadedFiles = [];

        for (const file of files) {
            totalSize += file.size;

            // Obtener la ruta relativa del archivo
            const relativePath = path.relative(
                path.join(__dirname, '..', 'uploads', user.username),
                file.path
            );

            // Crear o buscar la carpeta en la base de datos
            const folderPath = path.dirname(relativePath);
            let folder = await createFoldersInDatabase(user._id, folderPath);

            // Crear registro del archivo en la base de datos
            const newFile = await File.create({
                filename: file.filename,
                originalName: file.originalname,
                path: file.path,
                size: file.size,
                owner: user._id,
                folder: folder ? folder._id : null,
            });

            uploadedFiles.push(newFile);
        }

        // Actualizar el espacio usado
        user.usedSpace += totalSize;
        await user.save();

        res.status(201).json(uploadedFiles);
    } catch (error) {
        console.error('Error al subir la carpeta:', error);
        res.status(500).json({ message: 'Error al subir la carpeta' });
    }
};

// Función auxiliar para crear carpetas en la base de datos
async function createFoldersInDatabase(userId, folderPath) {
    if (!folderPath || folderPath === '.') {
        return null;
    }

    const folders = folderPath.split(path.sep);
    let parent = null;
    let currentPath = path.join(__dirname, '..', 'uploads', req.user.username);

    for (const folderName of folders) {
        currentPath = path.join(currentPath, folderName);

        let folder = await Folder.findOne({
            owner: userId,
            name: folderName,
            parent: parent ? parent._id : null,
        });

        if (!folder) {
            folder = await Folder.create({
                name: folderName,
                owner: userId,
                parent: parent ? parent._id : null,
                path: currentPath,
            });
        }

        parent = folder;
    }

    return parent;
}
