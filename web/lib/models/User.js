const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    userType: { type: String, enum: ['student', 'tutor', 'admin'], required: true },

    grade: { type: String },
    interests: [String],

    tutorApplication: {
        name: String,
        requestedType: String,
        age: Number,
        subjects: [String],
        educationLevel: String,
        experience: String,
        motivation: String,
        status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },
        appliedAt: Date,
        approvedAt: Date,
        deniedAt: Date,
        denialReason: String
    },

    tutorProfile: {
        subjects: [String],
        bio: String,
        educationLevel: String,
        availability: String,
        motivation: String,
        availableTimes: [String],
        experience: String
    },

    tutorRequests: [{
        subject: String,
        description: String,
        priority: String,
        requestedTime: String,
        requestedTutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, default: 'pending' },
        createdAt: { type: Date, default: Date.now },
        acceptedAt: Date,
        tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        hoursSpent: Number
    }],

    tutorSessions: [{
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        subject: String,
        scheduledTime: Date,
        status: { type: String, default: 'scheduled' },
        zoomLink: String,
        zoomMeetingId: String,
        zoomPassword: String,
        plannedHours: Number,
        hoursSpent: Number,
        createdAt: { type: Date, default: Date.now },
        completedAt: Date
    }],

    studentSessions: [{
        tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        tutorName: String,
        subject: String,
        scheduledTime: Date,
        status: { type: String, default: 'scheduled' },
        zoomLink: String,
        zoomMeetingId: String,
        zoomPassword: String,
        tutorSessionId: { type: mongoose.Schema.Types.ObjectId },
        plannedHours: Number,
        hoursSpent: Number,
        createdAt: { type: Date, default: Date.now },
        completedAt: Date
    }]
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
