const express = require('express');
const router = express.Router();
const Conversation = require('../models/Message');
const Post = require('../models/Post');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// All claim routes require authentication
router.use(protect);

// ── POST /api/claims  – Start a claim conversation ───────────────
router.post('/', async (req, res) => {
  try {
    const { postId, initialMessage } = req.body;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.status !== 'Active')
      return res.status(400).json({ success: false, message: 'This post is no longer active' });
    if (post.author.toString() === req.user._id.toString())
      return res.status(400).json({ success: false, message: 'You cannot claim your own post' });

    // One conversation per claimant per post (enforced by unique index)
    const conversation = await Conversation.create({
      post: postId,
      finder: post.author,
      claimant: req.user._id,
      messages: initialMessage
        ? [{ sender: req.user._id, content: initialMessage }]
        : [],
    });

    // Mark post as having a pending claim
    await Post.findByIdAndUpdate(postId, {
      status: 'Pending Claim',
      activeClaimId: conversation._id,
      $inc: { claimCount: 1 },
    });

    await conversation.populate([
      { path: 'finder', select: 'username displayName avatarUrl isVerifiedFinder' },
      { path: 'claimant', select: 'username displayName avatarUrl' },
      { path: 'post', select: 'itemName type landmark images' },
    ]);

    res.status(201).json({ success: true, data: conversation });
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ success: false, message: 'You have already submitted a claim for this post' });
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── GET /api/claims  – Get user's conversations ──────────────────
router.get('/', async (req, res) => {
  try {
    const conversations = await Conversation.find({
      $or: [{ finder: req.user._id }, { claimant: req.user._id }],
    })
      .sort({ lastActivityAt: -1 })
      .populate('post', 'itemName type landmark images status')
      .populate('finder', 'username displayName avatarUrl isVerifiedFinder')
      .populate('claimant', 'username displayName avatarUrl')
      .select('-messages'); // exclude message bodies in list view

    res.json({ success: true, data: conversations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/claims/:id  – Get full conversation ─────────────────
router.get('/:id', async (req, res) => {
  try {
    const conv = await Conversation.findOne({
      _id: req.params.id,
      $or: [{ finder: req.user._id }, { claimant: req.user._id }],
    })
      .populate('post', 'itemName type landmark images status description')
      .populate('finder', 'username displayName avatarUrl isVerifiedFinder trustPoints')
      .populate('claimant', 'username displayName avatarUrl')
      .populate('messages.sender', 'username displayName avatarUrl');

    if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found' });

    // Mark messages as read
    const isFinderViewing = conv.finder._id.toString() === req.user._id.toString();
    if (isFinderViewing) {
      conv.unreadByFinder = 0;
    } else {
      conv.unreadByClaimant = 0;
    }
    await conv.save();

    res.json({ success: true, data: conv });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/claims/:id/messages  – Send message ────────────────
router.post('/:id/messages', async (req, res) => {
  try {
    const conv = await Conversation.findOne({
      _id: req.params.id,
      $or: [{ finder: req.user._id }, { claimant: req.user._id }],
      claimStatus: { $nin: ['Approved', 'Rejected', 'Cancelled', 'Expired'] },
    });
    if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found or closed' });

    const { content, attachments } = req.body;
    await conv.addMessage({ sender: req.user._id, content, attachments });

    res.json({ success: true, data: conv.messages[conv.messages.length - 1] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── POST /api/claims/:id/proof  – Submit proof of ownership ──────
router.post('/:id/proof', async (req, res) => {
  try {
    const conv = await Conversation.findOne({
      _id: req.params.id,
      claimant: req.user._id,
      claimStatus: 'Open',
    });
    if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found' });

    await conv.submitProof({
      submittedBy: req.user._id,
      description: req.body.description,
      attachments: req.body.attachments || [],
    });

    res.json({ success: true, data: conv });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/claims/:id/approve  – Finder approves claim ───────
router.patch('/:id/approve', async (req, res) => {
  try {
    const conv = await Conversation.findOne({
      _id: req.params.id,
      finder: req.user._id,
      claimStatus: 'Proof Submitted',
    });
    if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found' });

    await conv.approveClaim({
      finderNote: req.body.finderNote,
      meetupLocation: req.body.meetupLocation,
      meetupScheduled: req.body.meetupScheduled,
    });

    // Resolve the post
    await Post.findByIdAndUpdate(conv.post, { status: 'Resolved', resolvedAt: new Date(), resolvedWith: conv.claimant });

    // Award trust points to finder (10 pts per successful return)
    const finderUser = await User.findById(req.user._id);
    await finderUser.awardTrustPoints(10);

    res.json({ success: true, data: conv, message: 'Claim approved! Item marked as returned.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/claims/:id/reject  – Finder rejects claim ─────────
router.patch('/:id/reject', async (req, res) => {
  try {
    const conv = await Conversation.findOne({
      _id: req.params.id,
      finder: req.user._id,
      claimStatus: { $in: ['Open', 'Proof Submitted', 'Pending Review'] },
    });
    if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found' });

    await conv.rejectClaim({ finderNote: req.body.finderNote });

    // Revert post to active
    await Post.findByIdAndUpdate(conv.post, { status: 'Active', activeClaimId: null });

    res.json({ success: true, data: conv, message: 'Claim rejected. Post is active again.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;