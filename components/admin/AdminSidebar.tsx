'use client'

import React from 'react'
import {
  LayoutDashboard,
  Calendar,
  Bell,
  Award,
  BookOpen,
  Layers,
  Users,
  ShieldCheck,
  Activity,
  Laptop,
  Settings,
  LogOut,
  X,
  ExternalLink,
  ClipboardCheck,
  UserRound,
} from 'lucide-react'

export type AdminTab =
  | 'dashboard'
  | 'events'
  | 'notices'
  | 'achievements'
  | 'learning-hub'
  | 'categories'
  | 'users'
  | 'roles'
  | 'audit-logs'
  | 'sessions'
  | 'settings'
  | 'connect-moderation'
  | 'connect-roster'

interface AdminSidebarProps {
  currentTab: AdminTab
  onSelectTab: (tab: AdminTab) => void
  userEmail: string
  userRole: string
  userName?: string | null
  onLogout: () => void
  isOpen: boolean
  onClose: () => void
}

export default function AdminSidebar({
  currentTab,
  onSelectTab,
  userEmail,
  userRole,
  userName,
  onLogout,
  isOpen,
  onClose,
}: AdminSidebarProps) {
  const navSections = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard' as AdminTab, label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Content Management',
      items: [
        { id: 'events' as AdminTab, label: 'Events', icon: Calendar },
        { id: 'notices' as AdminTab, label: 'Notice Board', icon: Bell },
        { id: 'achievements' as AdminTab, label: 'Achievements', icon: Award },
        { id: 'learning-hub' as AdminTab, label: 'Learning Hub', icon: BookOpen },
        { id: 'categories' as AdminTab, label: 'Categories', icon: Layers },
      ],
    },
    {
      title: 'Administration',
      items: [
        { id: 'users' as AdminTab, label: 'Admin Users', icon: Users },
        { id: 'roles' as AdminTab, label: 'Roles & Permissions', icon: ShieldCheck },
        { id: 'audit-logs' as AdminTab, label: 'Audit Logs', icon: Activity },
        { id: 'sessions' as AdminTab, label: 'Active Sessions', icon: Laptop },
        { id: 'settings' as AdminTab, label: 'Settings', icon: Settings },
      ],
    },
    ...((userRole === 'ADMIN' || userRole === 'SUPER_ADMIN')
      ? [{
          title: 'Connect',
          items: [
            { id: 'connect-moderation' as AdminTab, label: 'Connect management', icon: ClipboardCheck },
            ...(userRole === 'SUPER_ADMIN'
              ? [{ id: 'connect-roster' as AdminTab, label: 'Student list', icon: UserRound }]
              : []),
          ],
        }]
      : []),
  ]

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white border-r border-[#E2E8F0] select-none">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-[#F1F5F9]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#111827] text-white font-bold text-base shadow-sm">
            N
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[15px] tracking-tight text-[#111827]">
                Nexora Club
              </span>
              <span className="rounded-md bg-[#EEF2F6] px-1.5 py-0.5 text-[10px] font-semibold text-[#475569]">
                Admin
              </span>
            </div>
            <p className="text-[11px] text-[#64748B]">ISE Technical Portal</p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onClose}
          aria-label="Close sidebar"
          className="lg:hidden rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = currentTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id)
                      onClose()
                    }}
                    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all ${
                      isActive
                        ? 'bg-[#111827] text-white shadow-sm font-semibold'
                        : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#111827]'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 transition-colors ${
                        isActive ? 'text-white' : 'text-[#64748B] group-hover:text-[#111827]'
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* Quick Link to Public Site */}
        <div className="pt-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-xs font-medium text-[#475569] hover:bg-[#F1F5F9] hover:text-[#111827] transition-colors"
          >
            <span>View Public Website</span>
            <ExternalLink className="h-3.5 w-3.5 text-[#94A3B8]" />
          </a>
        </div>
      </div>

      {/* Current Admin User Profile Footer */}
      <div className="border-t border-[#F1F5F9] p-4 bg-[#FAFCFF]">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-white p-2.5 border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 font-semibold text-xs text-indigo-700 border border-indigo-100">
              {userEmail ? userEmail.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[#111827]">
                {userName || userEmail}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-medium text-[#64748B] uppercase tracking-wide">
                  {userRole}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Log out"
            aria-label="Log out"
            className="rounded-lg p-1.5 text-[#64748B] hover:bg-[#FEE2E2] hover:text-[#DC2626] transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-full shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
