'use client'

import React, { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import AdminSidebar, { AdminTab } from './AdminSidebar'
import AdminHeader from './AdminHeader'
import DashboardView from './views/DashboardView'
import EventsView from './views/EventsView'
import AchievementsView from './views/AchievementsView'
import LearningHubView from './views/LearningHubView'
import GalleryView from './views/GalleryView'
import CategoriesView from './views/CategoriesView'
import AdminUsersView from './views/AdminUsersView'
import RolesView from './views/RolesView'
import AuditLogsView from './views/AuditLogsView'
import SessionsView from './views/SessionsView'
import SettingsView from './views/SettingsView'
import ConnectModerationView from './ConnectModerationView'
import ConnectRosterView from './ConnectRosterView'

interface AdminUser {
  id: string
  email: string
  name?: string | null
  role: string
}

interface AdminDashboardProps {
  user: AdminUser
  onLogout: () => void
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const searchParams = useSearchParams()
  const [currentTab, setCurrentTab] = useState<AdminTab>(() => {
    const requestedTab = searchParams.get('tab')
    return requestedTab === 'connect-moderation' || requestedTab === 'connect-roster'
      ? requestedTab
      : 'dashboard'
  })
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openModalSignal, setOpenModalSignal] = useState(0)

  function handleQuickAction(type: string) {
    if (type === 'event' || type === 'events') {
      setCurrentTab('events')
      setOpenModalSignal((prev) => prev + 1)
    } else if (type === 'achievement' || type === 'achievements') {
      setCurrentTab('achievements')
      setOpenModalSignal((prev) => prev + 1)
    } else if (type === 'resource' || type === 'learning-hub') {
      setCurrentTab('learning-hub')
      setOpenModalSignal((prev) => prev + 1)
    } else if (type === 'gallery') {
      setCurrentTab('gallery')
      setOpenModalSignal((prev) => prev + 1)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] antialiased">
      {/* Sidebar Navigation */}
      <AdminSidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        userEmail={user.email}
        userRole={user.role}
        userName={user.name}
        onLogout={onLogout}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Workspace */}
      <div className="flex flex-col lg:pl-64">
        {/* Top Header */}
        <AdminHeader
          currentTab={currentTab}
          userRole={user.role}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onQuickAction={handleQuickAction}
        />

        {/* Content View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {currentTab === 'dashboard' && (
              <DashboardView
                onNavigate={(tab) => setCurrentTab(tab)}
                onQuickAction={handleQuickAction}
              />
            )}

            {currentTab === 'events' && (
              <EventsView key={`events-${openModalSignal}`} initialOpenModal={openModalSignal > 0} />
            )}

            {currentTab === 'achievements' && (
              <AchievementsView key={`achievements-${openModalSignal}`} initialOpenModal={openModalSignal > 0} />
            )}

            {currentTab === 'learning-hub' && (
              <LearningHubView key={`hub-${openModalSignal}`} initialOpenModal={openModalSignal > 0} />
            )}

            {currentTab === 'gallery' && (
              <GalleryView key={`gallery-${openModalSignal}`} initialOpenModal={openModalSignal > 0} />
            )}

            {currentTab === 'categories' && <CategoriesView />}

            {currentTab === 'users' && (
              <AdminUsersView
                currentUserRole={user.role}
                currentUserId={user.id}
              />
            )}

            {currentTab === 'roles' && <RolesView />}

            {currentTab === 'audit-logs' && <AuditLogsView />}

            {currentTab === 'sessions' && <SessionsView />}

            {currentTab === 'settings' && (
              <SettingsView
                userEmail={user.email}
                userRole={user.role}
                userName={user.name}
                onLogout={onLogout}
              />
            )}

            {currentTab === 'connect-moderation' && (
              <ConnectModerationView onNavigateToRoster={() => setCurrentTab('connect-roster')} />
            )}

            {currentTab === 'connect-roster' && <ConnectRosterView />}
          </div>
        </main>
      </div>
    </div>
  )
}
