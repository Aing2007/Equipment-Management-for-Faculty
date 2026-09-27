const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    username: {
        type: String, required: true, unique: true, trim: true
    },
    password: {
        type: String, required: true, select: false
    },
    name_sur: {
        type: String, required: true, trim: true
    },
    role: {
        type: String, enum: ['admin', 'personnel', 'evaluator', 'assessee'], default: 'assessee'
    },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
}, { timestamps: true });

UserSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.getSignedJwtToken = function() {
    return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '30d'
    });
};

UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
