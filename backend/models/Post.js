const mongoose = require('mongoose');

// ── Angeles City Landmarks ───────────────────────────────────────
const ANGELES_CITY_LANDMARKS = [
  'Nepo Quad',
  'SM City Clark',
  'Holy Angel University',
  'Balibago',
  'Clark International Airport',
  'Marquee Mall',
  'Robinsons Place Angeles',
  'Puregold Angeles',
  'St. Joseph Parish Church',
  'Friendship Highway',
  'MacArthur Highway',
  'Clarkfield',
  'Malabanias',
  'Pampang',
  'Cutcut',
  'Sto. Domingo',
  'Sapalibutad',
  'Lourdes Sur',
  'Dolores',
  'San Nicolas',
  'Other',
];

const ITEM_CATEGORIES = [
  'Electronics',
  'Wallet / Cards',
  'Keys',
  'Bag / Luggage',
  'Clothing',
  'Jewelry / Accessories',
  'Documents / IDs',
  'Pet',
  'Eyewear',
  'Toy / Children Item',
  'Medical Equipment',
  'Vehicle Part',
  'Cash / Money',
  'Other',
];

const ITEM_COLORS = [
  'Black', 'White', 'Gray', 'Silver', 'Brown', 'Beige',
  'Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple',
  'Pink', 'Gold', 'Multicolor', 'Other',
];

// ── Sub-schema: Image attachment ─────────────────────────────────
const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String }, // Cloudinary / S3 reference
  caption: { type: String, default: '' },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: false });

// ── Main Post Schema ─────────────────────────────────────────────
const postSchema = new mongoose.Schema(
  {
    // ── Author ───────────────────────────────────────────────────
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // ── Core Fields ──────────────────────────────────────────────
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [100, 'Item name cannot exceed 100 characters'],
    },
    type: {
      type: String,
      enum: ['Lost', 'Found'],
      required: [true, 'Post type (Lost/Found) is required'],
      index: true,
    },
    category: {
      type: String,
      enum: ITEM_CATEGORIES,
      required: [true, 'Category is required'],
      index: true,
    },

    // ── Physical Description ─────────────────────────────────────
    color: {
      type: String,
      enum: ITEM_COLORS,
      required: [true, 'Primary color is required'],
      index: true,
    },
    secondaryColor: {
      type: String,
      enum: [...ITEM_COLORS, null],
      default: null,
    },
    brand: { type: String, trim: true, default: null },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },

    // ── Hyper-Local Location ─────────────────────────────────────
    landmark: {
      type: String,
      enum: ANGELES_CITY_LANDMARKS,
      required: [true, 'Landmark is required'],
      index: true,
    },
    landmarkDetail: {
      // e.g., "Near the food court entrance, 2nd floor"
      type: String,
      trim: true,
      maxlength: [200, 'Landmark detail cannot exceed 200 characters'],
      default: null,
    },
    coordinates: {
  type: {
    type: String,
    enum: ['Point'],
  },
  coordinates: {
    type: [Number],
  },
},

    // ── Date & Time of Incident ──────────────────────────────────
    incidentDate: {
      type: Date,
      required: [true, 'Date of loss/find is required'],
      index: true,
    },
    incidentTimeApprox: {
      // e.g. "Morning", "Afternoon", "Evening", "Night"
      type: String,
      enum: ['Morning', 'Afternoon', 'Evening', 'Night', 'Unknown'],
      default: 'Unknown',
    },

    // ── Media ────────────────────────────────────────────────────
    images: [imageSchema],

    // ── Status & Resolution Workflow ─────────────────────────────
    status: {
      type: String,
      enum: ['Active', 'Pending Claim', 'Resolved', 'Closed', 'Expired'],
      default: 'Active',
      index: true,
    },
    resolvedAt: { type: Date, default: null },
    resolvedWith: {
      // The User ID of the person who successfully claimed the item
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ── Claim Management ─────────────────────────────────────────
    activeClaimId: {
      // Currently open claim conversation
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    claimCount: { type: Number, default: 0 }, // total claim attempts

    // ── Engagement ───────────────────────────────────────────────
    viewCount: { type: Number, default: 0 },
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // ── Moderation ───────────────────────────────────────────────
    isReported: { type: Boolean, default: false },
    reportCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    tags: [{ type: String, trim: true, lowercase: true }], // free-form search tags
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Compound Indexes for Filtering ──────────────────────────────
postSchema.index({ landmark: 1, type: 1, status: 1 });
postSchema.index({ category: 1, color: 1 });
postSchema.index({ incidentDate: -1, status: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ coordinates: '2dsphere' }, { sparse: true });// geospatial queries
postSchema.index({ tags: 1 });

// ── Text Search Index ────────────────────────────────────────────
postSchema.index(
  { itemName: 'text', description: 'text', tags: 'text' },
  { weights: { itemName: 10, tags: 5, description: 1 }, name: 'post_text_search' }
);

// ── Virtual: is the post still active ───────────────────────────
postSchema.virtual('isActive').get(function () {
  return this.status === 'Active';
});

// ── Virtual: days since posted ───────────────────────────────────
postSchema.virtual('daysOld').get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// ── Pre-save: auto-expire after 90 days ─────────────────────────
postSchema.pre('save', function (next) {
  if (this.status === 'Active' && this.daysOld > 90) {
    this.status = 'Expired';
  }
  next();
});

// ── Static: filtered feed query ─────────────────────────────────
postSchema.statics.getFilteredFeed = function ({
  type,
  landmark,
  category,
  color,
  dateFrom,
  dateTo,
  search,
  status = 'Active',
  page = 1,
  limit = 20,
  sortBy = 'createdAt',
  sortOrder = -1,
} = {}) {
  const filter = {};

  if (status) filter.status = status;
  if (type && ['Lost', 'Found'].includes(type)) filter.type = type;
  if (landmark) filter.landmark = landmark;
  if (category) filter.category = category;
  if (color) filter.color = color;
  if (dateFrom || dateTo) {
    filter.incidentDate = {};
    if (dateFrom) filter.incidentDate.$gte = new Date(dateFrom);
    if (dateTo) filter.incidentDate.$lte = new Date(dateTo);
  }
  if (search) filter.$text = { $search: search };

  const sort = { [sortBy]: sortOrder };
  const skip = (page - 1) * limit;

  return this.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('author', 'username displayName avatarUrl isVerifiedFinder trustPoints')
    .lean();
};

module.exports = mongoose.model('Post', postSchema);
module.exports.ANGELES_CITY_LANDMARKS = ANGELES_CITY_LANDMARKS;
module.exports.ITEM_CATEGORIES = ITEM_CATEGORIES;
module.exports.ITEM_COLORS = ITEM_COLORS;