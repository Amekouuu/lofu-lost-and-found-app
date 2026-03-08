const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // ── Identity ────────────────────────────────────────────────
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never returned in queries by default
    },

    // ── Profile ──────────────────────────────────────────────────
    displayName: { type: String, trim: true },
    avatarUrl: { type: String, default: null },
    phoneNumber: { type: String, trim: true, default: null },
    location: {
      barangay: { type: String, trim: true },
      landmark: { type: String, trim: true },
    },

    // ── Trust & Reputation System ────────────────────────────────
    trustPoints: { type: Number, default: 0, min: 0 },
    isVerifiedFinder: { type: Boolean, default: false },
    verifiedFinderAwardedAt: { type: Date, default: null },

    badges: [
      {
        type: {
          type: String,
          enum: ['verified_finder', 'good_samaritan', 'community_hero', 'first_return'],
        },
        awardedAt: { type: Date, default: Date.now },
      },
    ],

    // ── Activity Stats ───────────────────────────────────────────
    stats: {
      totalPostsCreated: { type: Number, default: 0 },
      totalItemsReturned: { type: Number, default: 0 },
      totalClaimsApproved: { type: Number, default: 0 },
      totalClaimsRejected: { type: Number, default: 0 },
    },

    // ── Auth & Security ──────────────────────────────────────────
    role: {
      type: String,
      enum: ['user', 'moderator', 'admin'],
      default: 'user',
    },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    lastLoginAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: null },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ──────────────────────────────────────────────────────
userSchema.index({ trustPoints: -1 });
userSchema.index({ isVerifiedFinder: 1 });

// ── Virtual: full profile URL ────────────────────────────────────
userSchema.virtual('profileUrl').get(function () {
  return `/users/${this._id}`;
});

// ── Pre-save: hash password ──────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance method: compare password ───────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Instance method: award trust points ─────────────────────────
userSchema.methods.awardTrustPoints = async function (points) {
  this.trustPoints += points;
  this.stats.totalItemsReturned += 1;

  // Auto-award "Verified Finder" badge at 50 trust points
  if (this.trustPoints >= 50 && !this.isVerifiedFinder) {
    this.isVerifiedFinder = true;
    this.verifiedFinderAwardedAt = new Date();
    this.badges.push({ type: 'verified_finder' });
  }

  return this.save();
};

module.exports = mongoose.model('User', userSchema);