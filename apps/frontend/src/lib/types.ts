export type User = {
  id: string;
  email: string;
  username: string;
  role?: "USER" | "ADMIN";
  emailVerified?: boolean;
  points: number;
  xp: number;
  level: number;
  loginStreak: number;
  referralCode: string;
  createdAt: string;
  lastLogin?: string | null;
};

export type QuestCategory = "DAILY" | "SOCIAL" | "SPONSORED";
export type GiveawayStatus = "ACTIVE" | "CLOSED";
export type GiveawayEntryStatus = "pending" | "selected" | "rejected";
export type SponsorRequestCategory =
  | "SOCIAL_MEDIA"
  | "CONTENT_CREATOR"
  | "COMMUNITY"
  | "PRODUCT_PROMOTION"
  | "EVENT_CAMPAIGN";
export type SponsorRequestStatus = "pending" | "accepted" | "rejected";

export type Quest = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  category: QuestCategory;
  platform?: string | null;
  link?: string | null;
  requiresProof?: boolean;
  proofInstructions?: string | null;
  xpReward: number;
  pointsReward: number;
  maxCompletions: number;
  completions: number;
  minLevel: number;
  createdAt: string;
  completionCount?: number;
  lastCompletedAt?: string | null;
  latestSubmission?: QuestSubmission | null;
};

export type QuestSubmissionStatus = "pending" | "approved" | "rejected";

export type QuestSubmission = {
  id: string;
  questId: string;
  userId: string;
  reviewedById?: string | null;
  status: QuestSubmissionStatus;
  proofUrl?: string | null;
  proofSecondaryUrl?: string | null;
  proofText?: string | null;
  reviewNote?: string | null;
  externalReference?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  quest?: Quest;
  user?: Pick<User, "id" | "username" | "email" | "level">;
  reviewedBy?: Pick<User, "id" | "username" | "email"> | null;
};

export type SponsorRequest = {
  id: string;
  submittedById: string;
  reviewedById?: string | null;
  publishedQuestId?: string | null;
  companyName: string;
  contactName: string;
  contactEmail: string;
  category: SponsorRequestCategory;
  title: string;
  description: string;
  imageUrl?: string | null;
  otherReason?: string | null;
  platform?: string | null;
  landingUrl?: string | null;
  proofRequirements?: string | null;
  requestedXpReward: number;
  requestedPointsReward: number;
  maxCompletions: number;
  minLevel: number;
  status: SponsorRequestStatus;
  reviewNote?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  submittedBy?: Pick<User, "id" | "username" | "email" | "level">;
  reviewedBy?: Pick<User, "id" | "username" | "email"> | null;
  publishedQuest?: Pick<Quest, "id" | "title" | "category" | "platform" | "createdAt" | "imageUrl"> | null;
};

export type RewardPlan = {
  id: string;
  label: string;
  pointsCost: number;
  tndPrice?: number | null;
};

export type RewardDeliveryField = {
  id: string;
  label: string;
  placeholder?: string | null;
  required?: boolean;
  type?: "TEXT" | "EMAIL" | "USERNAME" | "GAME_ID" | "SECRET" | "LINK";
  retention?: "persistent" | "until_processed";
};

export type GiveawayField = {
  id: string;
  label: string;
  placeholder?: string | null;
  required?: boolean;
  type?: "TEXT" | "EMAIL" | "USERNAME" | "GAME_ID" | "LINK";
};

export type Reward = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  pointsCost: number;
  tndPrice?: number | null;
  plans?: RewardPlan[] | null;
  deliveryFields?: RewardDeliveryField[] | null;
  minLevel: number;
  minAccountAge: number;
  stock: number;
  createdAt: string;
};

export type Giveaway = {
  id: string;
  title: string;
  description: string;
  prizeSummary?: string | null;
  imageUrl?: string | null;
  status: GiveawayStatus;
  promoted?: boolean | null;
  winnerCount?: number | null;
  minLevel?: number | null;
  minAccountAge?: number | null;
  allowEntryEdits?: boolean | null;
  inputFields?: GiveawayField[] | null;
  requiresJustification: boolean;
  justificationLabel?: string | null;
  endsAt?: string | null;
  createdAt: string;
  updatedAt: string;
  entryCount?: number;
  selectedCount?: number;
  viewerEntry?: GiveawayEntry | null;
};

export type GiveawayEntry = {
  id: string;
  giveawayId: string;
  userId: string;
  reviewedById?: string | null;
  status: GiveawayEntryStatus;
  answers?: Record<string, string> | null;
  justification?: string | null;
  justificationImageUrls?: string[] | null;
  createdAt: string;
  reviewedAt?: string | null;
  giveaway?: Giveaway | null;
  user?: Pick<User, "id" | "username" | "email" | "level"> | null;
  reviewedBy?: Pick<User, "id" | "username" | "email"> | null;
};

export type GiveawayDetails = Giveaway & {
  entries: GiveawayEntry[];
};

export type ReferralStats = {
  referralCode: string;
  total: number;
  rewarded: number;
  pending: number;
  rules: {
    maxReferralsPerDay: number;
    referralRewardLevel: number;
    referralPointsReward: number;
    referralXpReward: number;
  };
};

export type RewardDetails = Reward & {
  stats: {
    totalRedemptions: number;
    approvedRedemptions: number;
    pendingRedemptions: number;
  };
};

export type QuestDetails = Quest & {
  stats: {
    pendingSubmissions: number;
    approvedSubmissions: number;
    rejectedSubmissions: number;
  };
};

export type RedemptionStatus = "pending" | "approved" | "rejected" | "expired";

export type Redemption = {
  id: string;
  userId: string;
  rewardId: string;
  reviewedById?: string | null;
  status: RedemptionStatus;
  requestCode?: string | null;
  planId?: string | null;
  planLabel?: string | null;
  pointsSpent?: number | null;
  requestedInfo?: Record<string, string> | null;
  reviewNote?: string | null;
  createdAt: string;
  expiresAt?: string | null;
  processedAt?: string | null;
  sensitiveInfoPurgedAt?: string | null;
  reward?: Reward;
  user?: User;
  reviewedBy?: Pick<User, "id" | "username" | "email"> | null;
};
export type PlatformConfig = {
  id: string;
  maxXpPerDay: number;
  maxPointsPerDay: number;
  maxSocialTasksPerDay: number;
  redemptionCooldownHours: number;
  maxReferralsPerDay: number;
  referralRewardLevel: number;
  referralPointsReward: number;
  referralXpReward: number;
  maxSponsorRequestsPerUser: number;
  sponsorRequestWindowDays: number;
  redemptionRequestExpiryHours: number;
  spinCooldownHours: number;
  spinMinLevel: number;
  spinItems?: SpinItem[];
};

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AdminUserStats = {
  user: Pick<
    User,
    "id" | "username" | "email" | "role" | "level" | "points" | "xp" | "loginStreak" | "createdAt"
  >;
  stats: {
    completionsCount: number;
    submissionsPending: number;
    submissionsApproved: number;
    submissionsRejected: number;
    redemptionsTotal: number;
    redemptionsApproved: number;
    redemptionsPending: number;
    referralsSent: number;
    totalPointsDelta: number;
    totalXpDelta: number;
  };
};

export type AdminDashboardStats = {
  totals: {
    users: number;
    quests: number;
    activeQuests: number;
    sponsoredQuests: number;
    products: number;
    pendingSponsorRequests: number;
    pendingQuestSubmissions: number;
    pendingRedemptions: number;
    questCompletions: number;
    referrals: number;
    pointsIssued: number;
    xpIssued: number;
  };
  recentActivity: Array<{
    date: string;
    label: string;
    users: number;
    sponsorRequests: number;
    redemptions: number;
  }>;
  recentUsers: Array<Pick<User, "id" | "username" | "email" | "level" | "createdAt">>;
  recentSponsorRequests: Array<
    Pick<SponsorRequest, "id" | "title" | "companyName" | "status" | "createdAt" | "category" | "maxCompletions"> & {
      submittedBy?: Pick<User, "id" | "username" | "email" | "level">;
    }
  >;
  recentProducts: Array<Pick<Reward, "id" | "title" | "stock" | "pointsCost" | "createdAt">>;
};

export type SpinItem = {
  id: string;
  label: string;
  points: number;
  xp: number;
  weight: number;
  icon?: string;
};

export type SpinStatus = {
  minLevel: number;
  cooldownHours: number;
  canSpin: boolean;
  blockedByLevel: boolean;
  userLevel: number;
  lastSpinAt?: string | null;
  spinCountToday: number;
  nextAvailableAt?: string | null;
  items: SpinItem[];
};

export type SpinResult = {
  item: SpinItem;
  index: number;
  awardedXp: number;
  awardedPoints: number;
  capped: boolean;
  nextAvailableAt: string;
};

export type LeaderboardUser = {
  id: string;
  username: string;
  level: number;
  points: number;
  xp: number;
};

export type NotificationType =
  | "QUEST_SUBMISSION_REVIEWED"
  | "REDEMPTION_REVIEWED"
  | "ADMIN_REVIEW_REQUIRED"
  | "ADMIN_REDEMPTION_REQUIRED"
  | "ADMIN_SPONSOR_REQUEST_REQUIRED"
  | "SPONSOR_REQUEST_REVIEWED"
  | "SPONSOR_REQUEST_LIMIT_REACHED"
  | "SYSTEM";

export type PlatformNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  metadata?: Record<string, unknown> | null;
  readAt?: string | null;
  createdAt: string;
};

export type NotificationsPayload = {
  notifications: PlatformNotification[];
  unreadCount: number;
};


