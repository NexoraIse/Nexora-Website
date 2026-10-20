'use client'

import React, { useEffect, useState } from 'react'
import {
  Calendar,
  Award,
  BookOpen,
  FileEdit,
  Clock,
  ArrowUpRight,
  PlusCircle,
  Activity,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'
import { AdminTab } from '../AdminSidebar'

interface DashboardData {
  metrics: {
    totalEvents: number
    upcomingEvents: number
    publishedAchievements: number
    learningResources: number
    draftContent: number
  }
  recentEvents: any[]
  recentAchievements: any[]
  recentResources: any[]
  recentAuditLogs: any[]
}

interface DashboardViewProps {
  onNavigate: (tab: AdminTab) => void
  onQuickAction: (type: 'event' | 'achievement' | 'resource' | 'gallery') => void
}

export default function DashboardView({
  onNavigate,
  onQuickAction,
}: DashboardViewProps) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function loadDashboard() {
    try {
      setRefreshing(true)
      const res = await fetch('/api/admin/dashboard', { cache: 'no-store' })
      const resData = await res.json()
      if (res.ok) {
        setData(resData)
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl bg-white p-5 border border-[#E2E8F0] shadow-2xs"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-2xl bg-white border border-[#E2E8F0]" />
          <div className="h-80 animate-pulse rounded-2xl bg-white border border-[#E2E8F0]" />
        </div>
      </div>
    )
  }

  const metrics = data?.metrics || {
    totalEvents: 0,
    upcomingEvents: 0,
    publishedAchievements: 0,
    learningResources: 0,
    draftContent: 0,
  }

  const statCards = [
    {
      title: 'Total Events',
      value: metrics.totalEvents,
      sub: `${metrics.upcomingEvents} upcoming`,
      icon: Calendar,
      tab: 'events' as AdminTab,
      color: 'bg-blue-50 text-blue-700 border-blue-100',
    },
    {
      title: 'Upcoming Events',
      value: metrics.upcomingEvents,
      sub: 'Active schedule',
      icon: Clock,
      tab: 'events' as AdminTab,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
    {
      title: 'Achievements',
      value: metrics.publishedAchievements,
      sub: 'Verified results',
      icon: Award,
      tab: 'achievements' as AdminTab,
      color: 'bg-purple-50 text-purple-700 border-purple-100',
    },
    {
      title: 'Learning Hub',
      value: metrics.learningResources,
      sub: 'Study materials',
      icon: BookOpen,
      tab: 'learning-hub' as AdminTab,
      color: 'bg-sky-50 text-sky-700 border-sky-100',
    },
    {
      title: 'Draft Content',
      value: metrics.draftContent,
      sub: 'Pending review',
      icon: FileEdit,
      tab: 'events' as AdminTab,
      color: 'bg-slate-50 text-slate-700 border-slate-200',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions and Refresh */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-white p-5 border border-[#E2E8F0] shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-[#111827]">
            Overview Metrics
          </h2>
          <p className="text-xs text-[#64748B]">
            All data queried live from PostgreSQL production database.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onQuickAction('event')}
            className="flex items-center gap-1.5 rounded-xl bg-[#111827] px-3 py-2 text-xs font-semibold text-white hover:bg-[#273449] transition-colors shadow-2xs"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Create Event</span>
          </button>

          <button
            onClick={() => onQuickAction('achievement')}
            className="flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#111827] hover:bg-[#F1F5F9] transition-colors"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Add Achievement</span>
          </button>

          <button
            onClick={() => onQuickAction('gallery')}
            className="flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#111827] hover:bg-[#F1F5F9] transition-colors"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Add Photo</span>
          </button>

          <button
            onClick={loadDashboard}
            disabled={refreshing}
            title="Refresh database metrics"
            className="flex items-center justify-center rounded-xl border border-[#E2E8F0] bg-white p-2 text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC] transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.title}
              onClick={() => onNavigate(card.tab)}
              className="group cursor-pointer rounded-2xl bg-white p-4 sm:p-5 border border-[#E2E8F0] shadow-2xs hover:border-[#CBD5E1] hover:shadow-xs transition-all"
            >
              <div className="flex items-center justify-between">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg border ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight text-[#111827]">
                {card.value}
              </p>
              <p className="text-xs font-medium text-[#64748B] truncate">
                {card.title}
              </p>
              <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">
                {card.sub}
              </p>
            </div>
          )
        })}
      </div>

      {/* Two Column Layout for Recent Data */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming & Recent Events */}
        <div className="rounded-2xl bg-white p-5 border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#111827]" />
              <h3 className="text-sm font-bold text-[#111827]">Upcoming Events</h3>
            </div>
            <button
              onClick={() => onNavigate('events')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View all ({metrics.totalEvents})
            </button>
          </div>

          <div className="space-y-3">
            {data?.recentEvents && data.recentEvents.length > 0 ? (
              data.recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-xl p-3 border border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="truncate text-xs font-semibold text-[#111827]">
                      {event.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                        {event.category}
                      </span>
                      <span className="text-[11px] text-[#64748B]">
                        {event.dateDisplay || 'TBA'}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      event.status === 'PUBLISHED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {event.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-[#E2E8F0] p-6 text-center">
                <p className="text-xs text-[#64748B]">No events created yet.</p>
                <button
                  onClick={() => onQuickAction('event')}
                  className="mt-2 text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Create an event now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Achievements */}
        <div className="rounded-2xl bg-white p-5 border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-[#111827]" />
              <h3 className="text-sm font-bold text-[#111827]">Recent Achievements</h3>
            </div>
            <button
              onClick={() => onNavigate('achievements')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View all ({metrics.publishedAchievements})
            </button>
          </div>

          <div className="space-y-3">
            {data?.recentAchievements && data.recentAchievements.length > 0 ? (
              data.recentAchievements.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl p-3 border border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="truncate text-xs font-semibold text-[#111827]">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                      {item.competitionOrEvent || item.category} · {item.awardOrPosition || 'Verified'}
                    </p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-[#E2E8F0] p-6 text-center">
                <p className="text-xs text-[#64748B]">No achievements recorded yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Administrative Activity (Audit Logs) */}
        <div className="rounded-2xl bg-white p-5 border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#111827]" />
              <h3 className="text-sm font-bold text-[#111827]">Audit Trail</h3>
            </div>
            <button
              onClick={() => onNavigate('audit-logs')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Full Log
            </button>
          </div>

          <div className="space-y-3">
            {data?.recentAuditLogs && data.recentAuditLogs.length > 0 ? (
              data.recentAuditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-xl p-3 border border-[#F1F5F9] text-xs hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#111827]">
                        {log.action}
                      </span>
                      <span className="rounded bg-slate-100 px-1 py-0.2 text-[10px] text-slate-600">
                        {log.entity}
                      </span>
                    </div>
                    <p className="truncate text-[11px] text-[#64748B] mt-0.5">
                      {log.details || 'System event'}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-[#94A3B8]">
                    {new Date(log.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-[#E2E8F0] p-6 text-center">
                <p className="text-xs text-[#64748B]">No audit events recorded yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
