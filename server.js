require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Serve Static Files (HTML/CSS/JS)
app.use(express.static(path.join(__dirname, './')));

// Database Connection with better error handling for Render
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saintthunderbird', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => {
        console.error('❌ MongoDB Error:', err.message);
        console.error('💡 Make sure MONGODB_URI is set in your environment variables');
        // Don't crash the server, but log the error
    });

// --- ROUTE IMPORTS ---
// This connects the separate files you made
const authRoutes = require('./routes/auth');
const tutorRoutes = require('./routes/tutor');

// --- USE ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/tutor', tutorRoutes);

// Frontend Route (Fixes "Cannot GET /" errors)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));