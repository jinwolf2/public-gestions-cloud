// app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const fileRoutes = require('./routes/fileRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const folderRoutes = require('./routes/folderRoutes'); // Importar rutas de carpetas

const app = express();

// Middleware
app.use(express.json());

// Rutas
app.use('/api/files', fileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/folders', folderRoutes); // Usar rutas de carpetas

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Conectado a MongoDB');
    // Iniciar el servidor
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en puerto ${PORT}`);
    });
}).catch(err => console.error(err));
