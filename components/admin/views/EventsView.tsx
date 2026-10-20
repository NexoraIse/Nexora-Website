'use client'

import React, { useEffect, useState } from 'react'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  MapPin,
  ExternalLink,
  Loader2,
  Check,
  X,
  Upload,
  Rocket,
  RotateCcw,
  BellRing,
} from 'lucide-react'

interface EventItem {
  id: string
  title: string
  slug: string
  category: string
  description: string
  fullDescription?: string | null
  imageUrl?: string | null
  iconName?: string | null
  startDate?: string | null
  endDate?: string | null
  dateDisplay?: string | null
  venue?: string | null
  venueDisplay?: string | null
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'
  registrationOpen: boolean
  registrationUrl?: string | null
  eligibility?: string | null
  organizer?: string | null
  tags: string[]
  createdAt: string
}

interface EventsViewProps {
  initialOpenModal?: boolean
}

type LaunchStatus = 'NORMAL' | 'STAY_TUNED' | 'COUNTDOWN_RUNNING' | 'ANIMATION' | 'LAUNCHED'

type LaunchState = {
  status: LaunchStatus
  countdownStartedAt: string | null
  countdownEndsAt: string | null
  animationStartedAt: string | null
  animationEndsAt: string | null
  launchedAt: string | null
  version: string
  updatedAt: string
}

export default function EventsView({ initialOpenModal = false }: EventsViewProps) {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(initialOpenModal)
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [msg, setMsg] = useState('')
  const [launchState, setLaunchState] = useState<LaunchState | null>(null)
  const [launchBusyAction, setLaunchBusyAction] = useState<'' | 'enable_countdown' | 'launch' | 'reset'>('')
  const [launchMessage, setLaunchMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    category: 'Hackathon',
    description: '',
    fullDescription: '',
    dateDisplay: '',
    venueDisplay: '',
    registrationOpen: true,
    registrationUrl: '',
    eligibility: 'Open to all undergraduate engineering students.',
    organizer: 'Nexora ISE Technical Committee',
    tags: 'Hackathon, Coding',
    status: 'PUBLISHED' as 'PUBLISHED' | 'DRAFT' | 'ARCHIVED',
    imageUrl: '',
  })

  async function loadEvents() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (categoryFilter) params.set('category', categoryFilter)
      if (statusFilter) params.set('status', statusFilter)

      const res = await fetch(`/api/admin/events?${params.toString()}`)
      const data = await res.json()
      if (res.ok && data.events) {
        setEvents(data.events)
      }
    } catch (err) {
      console.error('Failed to load events:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadLaunchState() {
    try {
      const res = await fetch('/api/admin/launch', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok && data.state) {
        setLaunchState(data.state)
      }
    } catch (err) {
      console.error('Failed to load launch state:', err)
    }
  }

  useEffect(() => {
    loadEvents()
    loadLaunchState()
  }, [categoryFilter, statusFilter])

  async function runLaunchAction(action: 'enable_countdown' | 'launch' | 'reset') {
    setLaunchBusyAction(action)
    setLaunchMessage(null)

    try {
      const res = await fetch('/api/admin/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      const data = await res.json()
      if (!res.ok) {
        setLaunchMessage({ type: 'error', text: data.error || 'Launch action failed.' })
        return
      }

      setLaunchState(data.state || null)
      setLaunchMessage({
        type: 'success',
        text: data.message || 'Launch action completed successfully.',
      })
    } catch (err) {
      console.error('Launch action failed:', err)
      setLaunchMessage({ type: 'error', text: 'Network error while updating launch state.' })
    } finally {
      setLaunchBusyAction('')
    }
  }

  function formatLaunchTime(value: string | null) {
    if (!value) return '—'
    return new Date(value).toLocaleString()
  }

  const canLaunch = launchState?.status === 'STAY_TUNED'
  const launchRunning = launchState?.status === 'COUNTDOWN_RUNNING' || launchState?.status === 'ANIMATION'

  const statePillClass =
    launchState?.status === 'NORMAL'
      ? 'bg-slate-100 text-slate-700 border-slate-200'
      : launchState?.status === 'STAY_TUNED'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : launchState?.status === 'COUNTDOWN_RUNNING'
      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
      : launchState?.status === 'ANIMATION'
      ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200'

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    loadEvents()
  }

  function openCreateModal() {
    setEditingEvent(null)
    setFormData({
      title: '',
      category: 'Hackathon',
      description: '',
      fullDescription: '',
      dateDisplay: 'To be announced (TBA)',
      venueDisplay: 'ISE Department Campus Tech Hub (TBA)',
      registrationOpen: true,
      registrationUrl: '',
      eligibility: 'Open to all undergraduate engineering students.',
      organizer: 'Nexora ISE Technical Committee',
      tags: 'Hackathon, Coding',
      status: 'PUBLISHED',
      imageUrl: '/events/code-wars.svg',
    })
    setMsg('')
    setIsModalOpen(true)
  }

  function openEditModal(event: EventItem) {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      category: event.category,
      description: event.description,
      fullDescription: event.fullDescription || '',
      dateDisplay: event.dateDisplay || '',
      venueDisplay: event.venueDisplay || event.venue || '',
      registrationOpen: event.registrationOpen,
      registrationUrl: event.registrationUrl || '',
      eligibility: event.eligibility || '',
      organizer: event.organizer || '',
      tags: event.tags.join(', '),
      status: event.status,
      imageUrl: event.imageUrl || '',
    })
    setMsg('')
    setIsModalOpen(true)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingImage(true)
      const uploadData = new FormData()
      uploadData.append('file', file)
      uploadData.append('bucket', 'event-posters')

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadData,
      })
      const data = await res.json()
      if (res.ok && data.url) {
        setFormData((prev) => ({ ...prev, imageUrl: data.url }))
      } else {
        alert(data.error || 'Upload failed.')
      }
    } catch {
      alert('Upload failed due to network error.')
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setMsg('')

    try {
      const payload = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        fullDescription: formData.fullDescription,
        dateDisplay: formData.dateDisplay,
        venueDisplay: formData.venueDisplay,
        registrationOpen: formData.registrationOpen,
        registrationUrl: formData.registrationUrl || null,
        eligibility: formData.eligibility,
        organizer: formData.organizer,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
        status: formData.status,
        imageUrl: formData.imageUrl || null,
      }

      let res
      if (editingEvent) {
        res = await fetch('/api/admin/events', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingEvent.id, ...payload }),
        })
      } else {
        res = await fetch('/api/admin/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const resData = await res.json()
      if (!res.ok) {
        setMsg(resData.error || 'Failed to save event.')
        return
      }

      setIsModalOpen(false)
      loadEvents()
    } catch (err: unknown) {
      console.error('Save event failed:', err)
      setMsg('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete event "${title}"?`)) return

    try {
      const res = await fetch(`/api/admin/events?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        loadEvents()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete event.')
      }
    } catch {
      alert('Network error while deleting event.')
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#111827]">Event Launch Control</h2>
            <p className="mt-1 text-xs text-[#64748B]">
              Controls the global homepage inauguration sequence on /.
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${statePillClass}`}
          >
            State: {launchState?.status || 'LOADING'}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <button
            type="button"
            disabled={launchBusyAction !== '' || launchRunning}
            onClick={() => void runLaunchAction('enable_countdown')}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DCE2EA] bg-[#F8FAFC] px-4 py-2.5 text-xs font-semibold text-[#111827] hover:bg-[#EEF2F7] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {launchBusyAction === 'enable_countdown' ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
            Enable Countdown
          </button>

          <button
            type="button"
            disabled={launchBusyAction !== '' || !canLaunch}
            onClick={() => {
              if (!confirm('Start the global 10-second launch countdown now?')) return
              void runLaunchAction('launch')
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#111827] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#273449] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {launchBusyAction === 'launch' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            Launch
          </button>

          <button
            type="button"
            disabled={launchBusyAction !== ''}
            onClick={() => {
              if (!confirm('Reset launch state to NORMAL for all visitors?')) return
              void runLaunchAction('reset')
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {launchBusyAction === 'reset' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Reset Launch
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 text-[11px] text-[#64748B] sm:grid-cols-2">
          <p>Countdown start: <span className="font-semibold text-[#111827]">{formatLaunchTime(launchState?.countdownStartedAt || null)}</span></p>
          <p>Countdown end: <span className="font-semibold text-[#111827]">{formatLaunchTime(launchState?.countdownEndsAt || null)}</span></p>
          <p>Animation end: <span className="font-semibold text-[#111827]">{formatLaunchTime(launchState?.animationEndsAt || null)}</span></p>
          <p>Launched at: <span className="font-semibold text-[#111827]">{formatLaunchTime(launchState?.launchedAt || null)}</span></p>
        </div>

        {launchMessage && (
          <div
            className={`mt-4 rounded-xl border px-3 py-2.5 text-xs font-semibold ${
              launchMessage.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {launchMessage.text}
          </div>
        )}
      </section>

      {/* Controls Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-white p-4 sm:p-5 border border-[#E2E8F0] shadow-2xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search events by title or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-2 pl-9 pr-4 text-xs font-medium text-[#111827] placeholder-[#94A3B8] focus:border-[#647FEA] focus:bg-white focus:outline-none"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#475569] focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="Hackathon">Hackathon</option>
            <option value="Technical Fest">Technical Fest</option>
            <option value="Artificial Intelligence">Artificial Intelligence</option>
            <option value="Workshop">Workshop</option>
            <option value="Cybersecurity">Cybersecurity</option>
            <option value="Project Exhibition">Project Exhibition</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#475569] focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 rounded-xl bg-[#111827] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#273449] transition-colors shadow-2xs"
          >
            <Plus className="h-4 w-4" />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* Events Table / Grid */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#64748B]" />
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-[#111827]">No events found</p>
            <p className="text-xs text-[#64748B] mt-1">
              Create your first event or adjust search filters.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#111827] px-3.5 py-2 text-xs font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Event</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-semibold uppercase text-[#64748B]">
                <tr>
                  <th className="px-5 py-3.5">Event Title</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Date & Venue</th>
                  <th className="px-5 py-3.5">Registration</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                    <td className="px-5 py-4 font-semibold text-[#111827]">
                      <div className="max-w-xs">
                        <p className="truncate text-[13px]">{event.title}</p>
                        <p className="text-[11px] text-[#94A3B8] font-normal truncate mt-0.5">
                          slug: /{event.slug}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        {event.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#64748B]">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Calendar className="h-3 w-3 text-[#94A3B8]" />
                        <span>{event.dateDisplay || 'TBA'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] mt-0.5 text-[#94A3B8]">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate max-w-[160px]">{event.venueDisplay || 'TBA'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {event.registrationOpen ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                          <Check className="h-3 w-3" /> Open
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400">Closed</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          event.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : event.status === 'DRAFT'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(event)}
                          title="Edit event"
                          className="rounded-lg p-1.5 text-[#64748B] hover:bg-[#EEF2F6] hover:text-[#111827] transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id, event.title)}
                          title="Delete event"
                          className="rounded-lg p-1.5 text-[#64748B] hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl border border-[#E2E8F0]">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-5">
              <h3 className="text-base font-bold text-[#111827]">
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-[#64748B] hover:bg-[#F1F5F9]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {msg && (
              <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
                {msg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Code Wars 2026"
                    className="w-full rounded-xl border border-[#DCE2EA] px-3.5 py-2.5 text-xs text-[#111827] focus:border-[#647FEA] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-xl border border-[#DCE2EA] px-3.5 py-2.5 text-xs text-[#111827] focus:border-[#647FEA] focus:outline-none"
                  >
                    <option value="Hackathon">Hackathon</option>
                    <option value="Technical Fest">Technical Fest</option>
                    <option value="Artificial Intelligence">Artificial Intelligence</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="Project Exhibition">Project Exhibition</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    Publish Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full rounded-xl border border-[#DCE2EA] px-3.5 py-2.5 text-xs text-[#111827] focus:border-[#647FEA] focus:outline-none"
                  >
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    Short Summary / Description *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description displayed on cards..."
                    className="w-full rounded-xl border border-[#DCE2EA] px-3.5 py-2 text-xs text-[#111827] focus:border-[#647FEA] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    Full Description & Schedule
                  </label>
                  <textarea
                    rows={3}
                    value={formData.fullDescription}
                    onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                    placeholder="Comprehensive details shown in event modal..."
                    className="w-full rounded-xl border border-[#DCE2EA] px-3.5 py-2 text-xs text-[#111827] focus:border-[#647FEA] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    Date Display
                  </label>
                  <input
                    type="text"
                    value={formData.dateDisplay}
                    onChange={(e) => setFormData({ ...formData, dateDisplay: e.target.value })}
                    placeholder="e.g. Nov 14-15, 2026 or TBA"
                    className="w-full rounded-xl border border-[#DCE2EA] px-3.5 py-2.5 text-xs text-[#111827] focus:border-[#647FEA] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    Venue Display
                  </label>
                  <input
                    type="text"
                    value={formData.venueDisplay}
                    onChange={(e) => setFormData({ ...formData, venueDisplay: e.target.value })}
                    placeholder="e.g. ISE Seminar Hall"
                    className="w-full rounded-xl border border-[#DCE2EA] px-3.5 py-2.5 text-xs text-[#111827] focus:border-[#647FEA] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    Poster / Image URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="/events/code-wars.svg or https://..."
                      className="w-full rounded-xl border border-[#DCE2EA] px-3.5 py-2 text-xs text-[#111827] focus:border-[#647FEA] focus:outline-none"
                    />
                    <label className="cursor-pointer shrink-0 rounded-xl border border-[#DCE2EA] bg-[#F8FAFC] p-2 hover:bg-[#F1F5F9]">
                      <Upload className="h-4 w-4 text-[#64748B]" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                  {uploadingImage && (
                    <p className="text-[10px] text-indigo-600 mt-1">Uploading image...</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="Coding, Hackathon, Team Sprint"
                    className="w-full rounded-xl border border-[#DCE2EA] px-3.5 py-2 text-xs text-[#111827] focus:border-[#647FEA] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    Registration URL (optional)
                  </label>
                  <input
                    type="url"
                    value={formData.registrationUrl}
                    onChange={(e) => setFormData({ ...formData, registrationUrl: e.target.value })}
                    placeholder="https://forms.gle/..."
                    className="w-full rounded-xl border border-[#DCE2EA] px-3.5 py-2 text-xs text-[#111827] focus:border-[#647FEA] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 sm:pt-6">
                  <input
                    type="checkbox"
                    id="regOpen"
                    checked={formData.registrationOpen}
                    onChange={(e) => setFormData({ ...formData, registrationOpen: e.target.checked })}
                    className="h-4 w-4 rounded border-[#DCE2EA] text-[#111827] focus:ring-0"
                  />
                  <label htmlFor="regOpen" className="text-xs font-semibold text-[#111827]">
                    Registration is Open
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-xl bg-[#111827] px-4 py-2 text-xs font-semibold text-white hover:bg-[#273449] disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{editingEvent ? 'Save Changes' : 'Create Event'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
