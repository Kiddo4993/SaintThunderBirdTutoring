const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    tutorName: String,
    tutorEmail: String,
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    studentName: String,
    studentEmail: String,
    subject: String,
    zoomLink: String,
    scheduledTime: Date,
    status: { type: String, default: 'scheduled' } // scheduled, completed
});

module.exports = mongoose.model('Session', sessionSchema);