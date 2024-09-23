// models/Folder.js
const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
    path: { type: String, required: true }, // Ruta absoluta en el sistema de archivos
}, { timestamps: true });

// Índice para mejorar las consultas por owner y path
folderSchema.index({ owner: 1, path: 1 }, { unique: true });

module.exports = mongoose.model('Folder', folderSchema);
