// controllers/adminController.js
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { BASE_STORAGE_PATH } = require('../config/storageConfig');

// Función para generar tokens
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

// Crear un nuevo usuario (Solo Admin)
exports.createUser = async (req, res) => {
    const { username, password, role, diskSpace } = req.body;
    try {
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: 'Usuario ya existe' });
        }
        const user = await User.create({ username, password, role, diskSpace });

        // Crear carpeta de usuario
        const userFolder = path.join(BASE_STORAGE_PATH, username.path);
        fs.mkdirSync(userFolder, { recursive: true });

        res.status(201).json({
            _id: user._id,
            username: user.username,
            role: user.role,
            diskSpace: user.diskSpace,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el usuario' });
    }
}

// Obtener todos los usuarios (Solo Admin)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los usuarios' });
    }
}

// Actualizar el tamaño de disco de un usuario (Solo Admin)
exports.updateDiskSpace = async (req, res) => {
    const { diskSpace } = req.body;
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Verificar que el nuevo tamaño no sea menor que el espacio ya usado
        if (diskSpace < user.usedSpace) {
            return res.status(400).json({ message: 'El nuevo tamaño de disco es menor que el espacio ya utilizado' });
        }

        user.diskSpace = diskSpace;
        await user.save();

        res.json({ message: 'Espacio de disco actualizado', user });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el espacio de disco' });
    }
}
