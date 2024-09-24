// seeder.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken'); // Importar jsonwebtoken

const { BASE_STORAGE_PATH } = require('./config/storageConfig');

// Función para generar tokens
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Conectado a MongoDB para seeding');

        const adminExists = await User.findOne({ username: 'admin' });
        if (adminExists) {
            console.log('El usuario administrador ya existe');
            
            // Generar y mostrar el token para el admin existente
            const token = generateToken(adminExists._id);
            console.log(`Token para el administrador existente: ${token}`);
            
            process.exit();
        }

        const admin = await User.create({
            username: 'admin',
            password: 'Colorestu22', // Se encriptará automáticamente
            role: 'admin',
            diskSpace: 10737418240, // 10GB
        });

        // Crear carpeta de administrador
        const adminFolder = path.join(__dirname, '.', 'uploads', admin.username);
        fs.mkdirSync(adminFolder, { recursive: true });

        // Generar token para el nuevo administrador
        const token = generateToken(admin._id);
        console.log('Administrador creado exitosamente');
        console.log(`Token para el administrador: ${token}`);

        process.exit();
    } catch (error) {
        console.error('Error al crear el administrador:', error);
        process.exit(1);
    }
}

seedAdmin();
