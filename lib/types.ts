/**
 * =============================================================================
 * NEXORA ISE CLUB - APPLICATION TYPE DEFINITIONS
 * Centralized, strongly-typed contracts for frontend, backend, and database models.
 * =============================================================================
 */

// -----------------------------------------------------------------------------
// 1. Common & API Types
// -----------------------------------------------------------------------------
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  total?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  limit: number;
  totalPages: number;
}

// -----------------------------------------------------------------------------
// 2. Authentication & Admin RBAC
// -----------------------------------------------------------------------------
export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR';

export interface AdminUser {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminSession {
  id: string;
  adminEmail: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  expiresAt: string;
  createdAt: string;
}

// -----------------------------------------------------------------------------
// 3. Events Domain
// -----------------------------------------------------------------------------
export type EventCategory =
  | 'Hackathon'
  | 'Technical Fest'
  | 'Artificial Intelligence'
  | 'Workshop'
  | 'Cybersecurity'
  | 'Project Exhibition';

export type EventStatus = 'upcoming' | 'ongoing' | 'completed';
export type PublishStatus = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';

export interface EventItem {
  id: string;
  title: string;
  slug: string;
  category: EventCategory;
  description: string;
  fullDescription: string;
  imageUrl: string;
  iconName: 'Code' | 'Cpu' | 'BrainCircuit' | 'Globe' | 'ShieldCheck' | 'Lightbulb';
  eventDate: string | null;
  endDate?: string | null;
  registrationDeadline?: string | null;
  dateDisplay: string;
  startTime: string | null;
  endTime: string | null;
  venue: string | null;
  venueDisplay: string;
  status: EventStatus | PublishStatus;
  registrationOpen: boolean;
  registrationUrl?: string | null;
  eligibility: string;
  organizer: string;
  tags: string[];
  isSample: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegistrationPayload {
  event_id: string;
  full_name: string;
  email: string;
  phone?: string;
  college?: string;
}

export interface RegistrationRecord {
  id: string;
  event_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  college?: string | null;
  created_at: string;
}

// -----------------------------------------------------------------------------
// 4. Notices Domain
// -----------------------------------------------------------------------------
export type NoticePriority = 'NORMAL' | 'IMPORTANT' | 'URGENT';
export type NoticeCategory = 'Urgent' | 'Events' | 'Projects' | 'General';

export interface NoticeItem {
  id: string;
  date: string;
  title: string;
  slug?: string | null;
  summary?: string | null;
  content?: string | null;
  category: NoticeCategory | string;
  priority: NoticePriority;
  status: PublishStatus;
  publishDate?: string | null;
  expiryDate?: string | null;
  image?: string | null;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  attachmentName?: string | null;
  isPinned: boolean;
  authorName?: string | null;
  authorRole?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// -----------------------------------------------------------------------------
// 5. Achievements Domain
// -----------------------------------------------------------------------------
export interface AchievementItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  studentOrTeamName?: string | null;
  category: string;
  competitionOrEvent?: string | null;
  awardOrPosition?: string | null;
  achievementDate?: string | null;
  dateDisplay?: string | null;
  image?: string | null;
  externalUrl?: string | null;
  status: PublishStatus;
  createdAt?: string;
  updatedAt?: string;
}

// -----------------------------------------------------------------------------
// 6. Learning Hub & Academic Resources Domain
// -----------------------------------------------------------------------------
export interface LearningResourceItem {
  id: string;
  title: string;
  slug?: string | null;
  description: string;
  subject: string;
  semester?: number | null;
  academicYear?: string | null;
  category: string;
  resourceType: string;
  fileUrl?: string | null;
  thumbnailUrl?: string | null;
  tags: string[];
  status: PublishStatus;
  createdAt?: string;
  updatedAt?: string;
}

// -----------------------------------------------------------------------------
// 7. Categories & Audit Logging
// -----------------------------------------------------------------------------
export interface ContentCategoryItem {
  id: string;
  name: string;
  type: 'event' | 'notice' | 'achievement' | 'resource' | string;
  description?: string | null;
  createdAt?: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  adminId?: string | null;
  admin?: {
    email: string;
    name?: string | null;
    role: Role;
  } | null;
  createdAt: string;
}
