'use client'

import React from 'react'
import { Menu, Plus } from 'lucide-react'
import { AdminTab } from './AdminSidebar'
import AdminLaunchControl from './AdminLaunchControl'

interface AdminHeaderProps {
  currentTab: AdminTab
  onOpenMobileMenu: () => void
  onQuickAction?: (action: string) => void
  unreadCount?: number
  userRole?: string
}

const TAB_TITLES: Record<AdminTab, { title: string; description: string }> = {
  dashboard: {
    title: 'Dashboard Overview',
    description: 'Real-time club metrics, recent activity, and system status.',
  },
  events: {
    title: 'Events Management',
    description: 'Publish, organize, and manage campus workshops, hackathons, and symposiums.',
  },
  achievements: {
    title: 'Achievements Gallery',
    description: 'Record and showcase student awards, hackathon victories, and milestones.',
  },
  'learning-hub': {
    title: 'Learning Hub & Resources',
    description: 'Manage semester study materials, syllabus guides, notes, and question banks.',
  },
  gallery: {
    title: 'Photo Gallery Management',
    description: 'Add and curate moments and event photographs stored on Cloudinary.',
  },
  categories: {
    title: 'Content Categories',
    description: 'Organize tags and category taxonomy across all club content streams.',
  },
  users: {
    title: 'Admin Users',
    description: 'Manage staff and student administrators with role-based access control.',
  },
  roles: {
    title: 'Roles & Permissions',
    description: 'Review security policies and authorization matrices for club administrators.',
  },
  'audit-logs': {
    title: 'Security Audit Logs',
    description: 'Immutable forensic trail of administrative actions and content modifications.',
  },
  sessions: {
    title: 'Active Sessions',
    description: 'Inspect authenticated devices, IP addresses, and revoke active tokens.',
  },
  settings: {
    title: 'System Settings',
    description: 'Configure portal parameters, security preferences, and administrative profile.',
  },
  'connect-moderation': {
    title: 'Connect Management',
    description: 'View new profiles, reports, account access, and student number requests.',
  },
  'connect-roster': {
    title: 'Connect Student List',
    description: 'Manage the verified student list used for Connect registration.',
  },
}

export default function AdminHeader({
  currentTab,
  onOpenMobileMenu,
  onQuickAction,
  userRole = 'ADMIN',
}: AdminHeaderProps) {
  const currentMeta = TAB_TITLES[currentTab] || {
    title: 'Administration',
    description: 'Nexora Club Administration System',
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-[#E2E8F0] bg-white/95 px-4 backdrop-blur-md sm:px-8">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="rounded-lg p-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#111827] lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#111827]">
            {currentMeta.title}
          </h1>
          <p className="hidden text-xs text-[#64748B] sm:block">
            {currentMeta.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Launch Countdown Control in Admin Navbar */}
        <AdminLaunchControl userRole={userRole} />

        {/* Quick action button */}
        {onQuickAction && currentTab !== 'connect-moderation' && currentTab !== 'connect-roster' && (
          <button
            onClick={() => onQuickAction(currentTab)}
            className="flex items-center gap-1.5 rounded-xl bg-[#111827] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#273449] active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Record</span>
          </button>
        )}

      </div>
    </header>
  )
}
