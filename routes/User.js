const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: /.+\@.+\..+/
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    userType: {
        type: String,
        enum: ['student', 'tutor'],
        required: true
    },
    grade: String,
    
    // Student fields
    tutorRequests: [{
        subject: String,
        description: String,
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'completed'],
            default: 'pending'
        },
        createdAt: Date
    }],

    // Tutor fields
    tutorProfile: {
        subjects: [String],
        experience: String,
        availability: String,
        motivation: String,
        approvedAt: Date
    },

    tutorSessions: [{
        studentId: mongoose.Schema.Types.ObjectId,
        subject: String,
        description: String,
        scheduledTime: Date,
        status: {
            type: String,
            enum: ['scheduled', 'in-progress', 'completed'],
            default: 'scheduled'
        },
        createdAt: Date
    }],

    tutorApplication: {
        name: String,
        age: Number,
        status: {
            type: String,
            enum: ['pending', 'approved', 'denied'],
            default: 'pending'
        },
        appliedAt: Date,
        approvedAt: Date
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);