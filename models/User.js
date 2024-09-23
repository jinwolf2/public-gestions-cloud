// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    diskSpace: { type: Number, default: 1073741824 }, 
    usedSpace: { type: Number, default: 0 },
    pathdirUser:{type:String,default: null},
    role: { type: String, enum: ['user', 'admin'], default: 'user' }, 
}, { timestamps: true });

// Encriptar contraseña antes de guardar
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Método para comparar contraseñas
userSchema.methods.matchPassword = function(password) {
    return bcrypt.compare(password, this.password);
}

module.exports = mongoose.model('User', userSchema);
