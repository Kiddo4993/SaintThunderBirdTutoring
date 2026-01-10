const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    userType: { type: String, enum: ['student', 'tutor', 'admin'], required: true },
    // Tutors are 'pending' until admin approves them
    status: { type: String, enum: ['pending', 'active', 'denied'], default: 'active' },
    // Profile details
    subjects: [String],
    bio: String,
    availability: String,
    motivation: String
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);