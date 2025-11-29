require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models/User');
const authRoutes = require('./routes/auth');
const tutorRoutes = require('./routes/tutor');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Serve static files
app.use(express.static('.'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.log('❌ MongoDB Error:', err));

// Homepage
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tutor', tutorRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server running' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});