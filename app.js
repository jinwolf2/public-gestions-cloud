const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const fileRoutes = require('./routes/fileRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const folderRoutes = require('./routes/folderRoutes');

const app = express();

// Configuración global de CORS
app.use(cors({
  origin: 'http://localhost:5173', // Asegúrate de especificar correctamente el puerto del frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para parsear JSON
app.use(express.json());

// Rutas de la API
app.use('/api/files', fileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/folders', folderRoutes);

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Conectado a MongoDB');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en puerto ${PORT}`);
    });
}).catch(err => console.error(err));
