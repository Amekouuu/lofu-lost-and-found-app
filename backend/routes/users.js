const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const { protect } = require('../middleware/auth');

// GET /api/users/:id  – Public profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username displayName avatarUrl isVerifiedFinder trustPoints badges stats createdAt');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const posts = await Post.find({ author: req.params.id, status: { $ne: 'Closed' } })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('itemName type landmark status createdAt images');

    res.json({ success: true, data: { ...user.toObject(), recentPosts: posts } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/users/me  – Update own profile
router.patch('/me', protect, async (req, res) => {
  try {
    const ALLOWED = ['displayName', 'avatarUrl', 'phoneNumber', 'location'];
    const updates = {};
    ALLOWED.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;