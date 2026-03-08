const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { protect } = require('../middleware/auth');

// GET /api/posts/meta/filters  – Filter options (must be BEFORE /:id route)
router.get('/meta/filters', (req, res) => {
  const { ANGELES_CITY_LANDMARKS, ITEM_CATEGORIES, ITEM_COLORS } = require('../models/Post');
  res.json({
    success: true,
    data: {
      landmarks: ANGELES_CITY_LANDMARKS,
      categories: ITEM_CATEGORIES,
      colors: ITEM_COLORS,
      types: ['Lost', 'Found'],
      statuses: ['Active', 'Pending Claim', 'Resolved', 'Closed', 'Expired'],
    },
  });
});

// GET /api/posts  – Public feed with filtering
router.get('/', async (req, res) => {
  try {
    const {
      type, landmark, category, color,
      dateFrom, dateTo, search, status,
      page = 1, limit = 20,
      sortBy = 'createdAt', sortOrder = 'desc',
    } = req.query;

    const posts = await Post.getFilteredFeed({
      type, landmark, category, color,
      dateFrom, dateTo, search,
      status: status || 'Active',
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 50),
      sortBy,
      sortOrder: sortOrder === 'asc' ? 1 : -1,
    });

    const filter = { status: status || 'Active' };
    if (type) filter.type = type;
    if (landmark) filter.landmark = landmark;
    if (category) filter.category = category;
    if (color) filter.color = color;

    const total = await Post.countDocuments(filter);

    res.json({
      success: true,
      data: posts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/posts/:id  – Single post
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate('author', 'username displayName avatarUrl isVerifiedFinder trustPoints');

    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/posts  – Create post (auth required)
router.post('/', protect, async (req, res) => {
  try {
    const post = await Post.create({ ...req.body, author: req.user._id });
    await req.user.updateOne({ $inc: { 'stats.totalPostsCreated': 1 } });
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/posts/:id  – Update post (owner only)
router.patch('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, author: req.user._id });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found or unauthorized' });

    const ALLOWED_UPDATES = ['itemName', 'description', 'landmarkDetail', 'images', 'tags', 'incidentTimeApprox'];
    ALLOWED_UPDATES.forEach((field) => {
      if (req.body[field] !== undefined) post[field] = req.body[field];
    });

    await post.save();
    res.json({ success: true, data: post });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/posts/:id  – Delete (owner or admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const query = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, author: req.user._id };

    const post = await Post.findOneAndDelete(query);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found or unauthorized' });

    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;