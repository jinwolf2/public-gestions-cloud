// controllers/userController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { BASE_STORAGE_PATH } = require('../config/storageConfig');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

exports.registerUser = async (req, res) => {
    const { username, password } = req.body;
    try {
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: 'Usuario ya existe' });
        }
        const user = await User.create({ username, password });

        // Crear carpeta de usuario
        const userFolder = path.join(BASE_STORAGE_PATH, username);
        console.log('BASE_STORAGE_PATH:', BASE_STORAGE_PATH);
        console.log('Intentando crear la carpeta del usuario en:', userFolder);

        U

        try {
            fs.mkdirSync(userFolder, { recursive: true });
        } catch (fsError) {
            console.error('Error al crear la carpeta del usuario:', fsError.message);
            console.error('Stack Trace:', fsError.stack);
            return res.status(500).json({ message: 'Error al crear la carpeta del usuario' });
        }

        res.status(201).json({
            _id: user._id,
            username: user.username,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Error al registrar el usuario:', error.message);
        console.error('Stack Trace:', error.stack);
        res.status(500).json({ message: 'Error al registrar el usuario' });
    }
};

exports.loginUser = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Credenciales inválidas' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error al iniciar sesión' });
    }
}

exports.getUserProfile = async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ message: 'Usuario no encontrado' });
    }
}

exports.updateDiskSpace = async (req, res) => {
    const { diskSpace } = req.body;
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        user.diskSpace = diskSpace;
        await user.save();

        res.json({ message: 'Espacio de disco actualizado', user });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el espacio de disco' });
    }
}
