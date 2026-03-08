// ────────────────────────────────────────────────────────────────
//  LoFu – Shared TypeScript Models
//  src/app/models/lofu.models.ts
// ────────────────────────────────────────────────────────────────

// ── Enums ────────────────────────────────────────────────────────
export type PostType = 'Lost' | 'Found';

export type PostStatus = 'Active' | 'Pending Claim' | 'Resolved' | 'Closed' | 'Expired';

export type ClaimStatus =
  | 'Open'
  | 'Proof Submitted'
  | 'Pending Review'
  | 'Approved'
  | 'Rejected'
  | 'Cancelled'
  | 'Expired';

export type UserRole = 'user' | 'moderator' | 'admin';

export type BadgeType =
  | 'verified_finder'
  | 'good_samaritan'
  | 'community_hero'
  | 'first_return';

export const ANGELES_CITY_LANDMARKS = [
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
] as const;

export type Landmark = (typeof ANGELES_CITY_LANDMARKS)[number];

export const ITEM_CATEGORIES = [
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
] as const;

export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

export const ITEM_COLORS = [
  'Black', 'White', 'Gray', 'Silver', 'Brown', 'Beige',
  'Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple',
  'Pink', 'Gold', 'Multicolor', 'Other',
] as const;

export type ItemColor = (typeof ITEM_COLORS)[number];

// ── User ─────────────────────────────────────────────────────────
export interface UserBadge {
  type: BadgeType;
  awardedAt: string;
}

export interface UserStats {
  totalPostsCreated: number;
  totalItemsReturned: number;
  totalClaimsApproved: number;
  totalClaimsRejected: number;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  displayName?: string;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  location?: {
    barangay?: string;
    landmark?: string;
  };
  trustPoints: number;
  isVerifiedFinder: boolean;
  verifiedFinderAwardedAt?: string | null;
  badges: UserBadge[];
  stats: UserStats;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser extends User {
  // includes sensitive fields only available on own profile
  isBanned: boolean;
}

// ── Post ─────────────────────────────────────────────────────────
export interface PostImage {
  url: string;
  publicId?: string;
  caption?: string;
  uploadedAt: string;
}

export interface Post {
  _id: string;
  author: Pick<User, '_id' | 'username' | 'displayName' | 'avatarUrl' | 'isVerifiedFinder' | 'trustPoints'>;
  itemName: string;
  type: PostType;
  category: ItemCategory;
  color: ItemColor;
  secondaryColor?: ItemColor | null;
  brand?: string | null;
  description: string;
  landmark: Landmark;
  landmarkDetail?: string | null;
  coordinates?: { type: 'Point'; coordinates: [number, number] };
  incidentDate: string;
  incidentTimeApprox: 'Morning' | 'Afternoon' | 'Evening' | 'Night' | 'Unknown';
  images: PostImage[];
  status: PostStatus;
  resolvedAt?: string | null;
  resolvedWith?: string | null;
  activeClaimId?: string | null;
  claimCount: number;
  viewCount: number;
  bookmarks: string[];
  isReported: boolean;
  isFeatured: boolean;
  tags: string[];
  // virtuals
  isActive: boolean;
  daysOld: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostDto {
  itemName: string;
  type: PostType;
  category: ItemCategory;
  color: ItemColor;
  secondaryColor?: ItemColor;
  brand?: string;
  description: string;
  landmark: Landmark;
  landmarkDetail?: string;
  incidentDate: string;
  incidentTimeApprox?: 'Morning' | 'Afternoon' | 'Evening' | 'Night' | 'Unknown';
  images?: PostImage[];
  tags?: string[];
}

export interface UpdatePostDto extends Partial<Pick<CreatePostDto, 'itemName' | 'description' | 'landmarkDetail' | 'images' | 'tags' | 'incidentTimeApprox'>> {}

// ── Post Filters ─────────────────────────────────────────────────
export interface PostFilters {
  type?: PostType;
  landmark?: Landmark;
  category?: ItemCategory;
  color?: ItemColor;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  status?: PostStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ── Pagination ───────────────────────────────────────────────────
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ── Message / Claim ──────────────────────────────────────────────
export interface MessageAttachment {
  url: string;
  publicId?: string;
  fileType: 'image' | 'document' | 'receipt';
  originalName?: string;
  caption?: string;
  uploadedAt: string;
}

export interface ChatMessage {
  _id: string;
  sender: Pick<User, '_id' | 'username' | 'displayName' | 'avatarUrl'>;
  content: string;
  attachments: MessageAttachment[];
  isSystemMessage: boolean;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface ProofOfOwnership {
  submittedBy: string;
  description: string;
  attachments: MessageAttachment[];
  submittedAt: string;
}

export interface Conversation {
  _id: string;
  post: Pick<Post, '_id' | 'itemName' | 'type' | 'landmark' | 'images' | 'status'>;
  finder: Pick<User, '_id' | 'username' | 'displayName' | 'avatarUrl' | 'isVerifiedFinder'>;
  claimant: Pick<User, '_id' | 'username' | 'displayName' | 'avatarUrl'>;
  claimStatus: ClaimStatus;
  messages: ChatMessage[];
  proofOfOwnership?: ProofOfOwnership;
  resolvedAt?: string | null;
  finderNote?: string | null;
  meetupLocation?: string | null;
  meetupScheduled?: string | null;
  unreadByFinder: number;
  unreadByClaimant: number;
  lastActivityAt: string;
  messageCount: number;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Auth DTOs ─────────────────────────────────────────────────────
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  data: AuthUser;
}

// ── Filter Metadata (from /api/posts/meta/filters) ───────────────
export interface FilterMetadata {
  landmarks: readonly string[];
  categories: readonly string[];
  colors: readonly string[];
  types: PostType[];
  statuses: PostStatus[];
}