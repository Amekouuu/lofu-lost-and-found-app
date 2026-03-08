const mongoose = require('mongoose');

// ── Sub-schema: Individual Message ───────────────────────────────
const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
      default: '',
    },
    attachments: [
      {
        url: { type: String, required: true },
        publicId: { type: String }, // Cloudinary / S3 key
        fileType: {
          type: String,
          enum: ['image', 'document', 'receipt'],
          default: 'image',
        },
        originalName: { type: String },
        caption: { type: String, default: '' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    isSystemMessage: { type: Boolean, default: false }, // e.g., "Claim approved"
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ── Sub-schema: Proof of Ownership ───────────────────────────────
const proofOfOwnershipSchema = new mongoose.Schema(
  {
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {
      type: String,
      required: [true, 'Proof description is required'],
      minlength: [10, 'Please provide a more detailed description'],
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    attachments: [
      {
        url: { type: String, required: true },
        publicId: { type: String },
        fileType: {
          type: String,
          enum: ['photo', 'receipt', 'document', 'screenshot'],
          default: 'photo',
        },
        originalName: { type: String },
      },
    ],
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ── Main Conversation (Claim Thread) Schema ──────────────────────
const conversationSchema = new mongoose.Schema(
  {
    // ── Participants ─────────────────────────────────────────────
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
    finder: {
      // The user who POSTED the found/lost item
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    claimant: {
      // The user attempting to claim ownership
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ── Claim Status Workflow ─────────────────────────────────────
    // Open → Proof Submitted → Pending Review → Approved | Rejected | Cancelled
    claimStatus: {
      type: String,
      enum: [
        'Open',            // Chat started, no proof yet
        'Proof Submitted', // Claimant uploaded proof
        'Pending Review',  // Finder is reviewing
        'Approved',        // Finder approved → triggers resolution
        'Rejected',        // Finder rejected the claim
        'Cancelled',       // Claimant withdrew
        'Expired',         // No activity for 7 days
      ],
      default: 'Open',
      index: true,
    },

    // ── Messages ─────────────────────────────────────────────────
    messages: [messageSchema],

    // ── Proof of Ownership ───────────────────────────────────────
    proofOfOwnership: proofOfOwnershipSchema,

    // ── Resolution Details ───────────────────────────────────────
    resolvedAt: { type: Date, default: null },
    finderNote: {
      // Private note from finder explaining approval/rejection
      type: String,
      maxlength: [500],
      default: null,
    },
    meetupLocation: {
      // Agreed-upon meetup spot for item return
      type: String,
      maxlength: [200],
      default: null,
    },
    meetupScheduled: { type: Date, default: null },

    // ── Unread Counters ──────────────────────────────────────────
    unreadByFinder: { type: Number, default: 0 },
    unreadByClaimant: { type: Number, default: 0 },

    // ── Meta ─────────────────────────────────────────────────────
    lastActivityAt: { type: Date, default: Date.now },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ──────────────────────────────────────────────────────
conversationSchema.index({ post: 1, claimant: 1 }, { unique: true }); // one claim per user per post
conversationSchema.index({ finder: 1, claimStatus: 1 });
conversationSchema.index({ claimant: 1, claimStatus: 1 });
conversationSchema.index({ lastActivityAt: -1 });
conversationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// ── Virtual: message count ───────────────────────────────────────
conversationSchema.virtual('messageCount').get(function () {
  return this.messages.length;
});

// ── Virtual: is resolved ────────────────────────────────────────
conversationSchema.virtual('isResolved').get(function () {
  return this.claimStatus === 'Approved';
});

// ── Method: add a message ────────────────────────────────────────
conversationSchema.methods.addMessage = async function ({
  sender,
  content,
  attachments = [],
  isSystemMessage = false,
}) {
  this.messages.push({ sender, content, attachments, isSystemMessage });
  this.lastActivityAt = new Date();

  // Update unread counters
  const senderId = sender.toString();
  if (senderId === this.finder.toString()) {
    this.unreadByClaimant += 1;
  } else {
    this.unreadByFinder += 1;
  }

  return this.save();
};

// ── Method: submit proof ─────────────────────────────────────────
conversationSchema.methods.submitProof = async function ({ submittedBy, description, attachments }) {
  this.proofOfOwnership = { submittedBy, description, attachments };
  this.claimStatus = 'Proof Submitted';
  this.lastActivityAt = new Date();

  // Add system message
  this.messages.push({
    sender: submittedBy,
    content: '📎 Proof of ownership submitted. Awaiting finder review.',
    isSystemMessage: true,
  });
  this.unreadByFinder += 1;

  return this.save();
};

// ── Method: approve claim ────────────────────────────────────────
conversationSchema.methods.approveClaim = async function ({ finderNote, meetupLocation, meetupScheduled }) {
  this.claimStatus = 'Approved';
  this.resolvedAt = new Date();
  this.finderNote = finderNote;
  this.meetupLocation = meetupLocation;
  this.meetupScheduled = meetupScheduled;
  this.lastActivityAt = new Date();

  this.messages.push({
    sender: this.finder,
    content: '✅ Your claim has been approved! Please coordinate with the finder for item return.',
    isSystemMessage: true,
  });
  this.unreadByClaimant += 1;

  return this.save();
};

// ── Method: reject claim ─────────────────────────────────────────
conversationSchema.methods.rejectClaim = async function ({ finderNote }) {
  this.claimStatus = 'Rejected';
  this.finderNote = finderNote;
  this.lastActivityAt = new Date();

  this.messages.push({
    sender: this.finder,
    content: '❌ Your claim has been reviewed and rejected. Please contact support if you believe this is an error.',
    isSystemMessage: true,
  });
  this.unreadByClaimant += 1;

  return this.save();
};

module.exports = mongoose.model('Conversation', conversationSchema);