const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = authMiddleware;

const authMiddleware = require('./middleware/auth');

// Only logged-in users can access
app.get('/api/dashboard', authMiddleware, (req, res) => {
    res.json({ message: `Welcome ${req.user.email}` });
});