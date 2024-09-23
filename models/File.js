// models/File.js
const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    path: { type: String, required: true },
    size: { type: Number, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
}, { timestamps: true });

module.exports = mongoose.model('File', fileSchema);
