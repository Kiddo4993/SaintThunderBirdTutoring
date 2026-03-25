const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Session = require('../models/Session');
const authMiddleware = require('../middleware/auth');

// POST /api/sessions/request — Student creates a tutoring request
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const { subject, hours } = req.body;
    const student = await User.findById(req.user.userId);
    const newRequest = new Session({
      studentId: req.user.userId,
      studentName: student.name || `${student.firstName} ${student.lastName}`,
      studentEmail: student.email,
      subject,
      hours,
      status: 'pending',
      createdAt: new Date()
    });
    await newRequest.save();
    // Update student stats
    await User.findByIdAndUpdate(req.user.userId, { $inc: { 'stats.requestsMade': 1 } });
    res.json({ success: true, message: 'Request sent to tutors!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/sessions/pending — Tutor fetches pending requests
router.get('/pending', authMiddleware, async (req, res) => {
  try {
    const requests = await Session.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/sessions/accept/:id — Tutor accepts a pending request
router.post('/accept/:id', authMiddleware, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session || session.status !== 'pending') {
      return res.status(404).json({ message: 'Request not found or already accepted' });
    }
    const tutor = await User.findById(req.user.userId);
    session.tutorId = req.user.userId;
    session.tutorName = tutor.name || `${tutor.firstName} ${tutor.lastName}`;
    session.tutorEmail = tutor.email;
    session.status = 'accepted';
    session.acceptedAt = new Date();
    await session.save();
    res.json({ success: true, message: 'Request accepted!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
