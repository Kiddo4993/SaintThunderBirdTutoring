const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    userType: { type: String, enum: ['student', 'tutor', 'admin'], required: true },
    
    // Grade and Interests (For Students)
    grade: { type: String },
    interests: [String],

    // TUTOR APPLICATION DATA
    // This matches what your routes/tutor.js is trying to save
    tutorApplication: {
        name: String,
        age: Number,
        status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },
        appliedAt: Date,
        approvedAt: Date
    },

    // TUTOR PROFILE (Visible on the website boxes)
    tutorProfile: {
        subjects: [String],
        bio: String,
        availability: String,
        motivation: String
    },

    // EMBEDDED REQUESTS (If you want to keep them inside the User object)
    tutorRequests: [{
        subject: String,
        description: String,
        priority: String,
        status: { type: String, default: 'pending' },
        createdAt: { type: Date, default: Date.now },
        acceptedAt: Date,
        tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        hoursSpent: Number
    }],

    // EMBEDDED SESSIONS (for tutors)
    tutorSessions: [{
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        subject: String,
        scheduledTime: Date,
        status: { type: String, default: 'scheduled' },
        zoomLink: String,
        zoomMeetingId: String,
        zoomPassword: String,
        hoursSpent: Number,
        createdAt: { type: Date, default: Date.now },
        completedAt: Date
    }],
    
    // EMBEDDED SESSIONS (for students - mirrors tutor sessions)
    studentSessions: [{
        tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        tutorName: String,
        subject: String,
        scheduledTime: Date,
        status: { type: String, default: 'scheduled' },
        zoomLink: String,
        zoomMeetingId: String,
        zoomPassword: String,
        hoursSpent: Number,
        createdAt: { type: Date, default: Date.now },
        completedAt: Date
    }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);