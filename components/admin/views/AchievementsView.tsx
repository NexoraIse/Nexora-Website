'use client'

import React, { useEffect, useState } from 'react'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Award,
  Loader2,
  X,
  Upload,
  Calendar,
  ExternalLink,
} from 'lucide-react'

interface AchievementItem {
  id: string
  title: string
  slug: string
  category: string
  description: string
  studentOrTeamName?: string | null
  competitionOrEvent?: string | null
  awardOrPosition?: string | null
  achievementDate?: string | null
  dateDisplay?: string | null
  image?: string | null
  externalUrl?: string | null
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'
  createdAt: string
}

interface AchievementsViewProps {
  initialOpenModal?: boolean
}

export default function AchievementsView({ initialOpenModal = false }: AchievementsViewProps) {
  const [achievements, setAchievements] = useState<AchievementItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(initialOpenModal)
  const [editingItem, setEditingItem] = useState<AchievementItem | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [msg, setMsg] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    category: 'Technical competition',
    description: '',
    studentOrTeamName: '',
    competitionOrEvent: '',
    awardOrPosition: '1st Place / Winner',
    dateDisplay: 'March 2026',
    image: '',
    externalUrl: '',
    status: 'PUBLISHED' as 'PUBLISHED' | 'DRAFT' | 'ARCHIVED',
  })

  async function loadAchievements() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (categoryFilter) params.set('category', categoryFilter)

      const res = await fetch(`/api/admin/achievements?${params.toString()}`)
      const data = await res.json()
      if (res.ok && data.achievements) {
        setAchievements(data.achievements)
      }
    } catch (err) {
      console.error('Failed to load achievements:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAchievements()
  }, [categoryFilter])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    loadAchievements()
  }

  function openCreateModal() {
    setEditingItem(null)
    setFormData({
      title: '',
      category: 'Technical competition',
      description: '',
      studentOrTeamName: '',
      competitionOrEvent: '',
      awardOrPosition: '1st Place / Winner',
      dateDisplay: 'March 2026',
      image: '',
      externalUrl: '',
      status: 'PUBLISHED',
    })
    setMsg('')
    setIsModalOpen(true)
  }

  function openEditModal(item: AchievementItem) {
    setEditingItem(item)
    setFormData({
      title: item.title,
      category: item.category,
      description: item.description,
      studentOrTeamName: item.studentOrTeamName || '',
      competitionOrEvent: item.competitionOrEvent || '',
      awardOrPosition: item.awardOrPosition || '',
      dateDisplay: item.dateDisplay || '',
      image: item.image || '',
      externalUrl: item.externalUrl || '',
      status: item.status,
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
      uploadData.append('bucket', 'achievement-images')

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadData,
      })
      const data = await res.json()
      if (res.ok && data.url) {
        setFormData((prev) => ({ ...prev, image: data.url }))
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
      let res
      if (editingItem) {
        res = await fetch('/api/admin/achievements', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingItem.id, ...formData }),
        })
      } else {
        res = await fetch('/api/admin/achievements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
      }

      const resData = await res.json()
      if (!res.ok) {
        setMsg(resData.error || 'Failed to save achievement.')
        return
      }

      setIsModalOpen(false)
      loadAchievements()
    } catch (err: unknown) {
      console.error('Save achievement failed:', err)
      setMsg('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete achievement "${title}"?`)) return

    try {
      const res = await fetch(`/api/admin/achievements?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        loadAchievements()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete achievement.')
      }
    } catch {
      alert('Network error while deleting achievement.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-white p-4 sm:p-5 border border-[#E2E8F0] shadow-2xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search achievements by title, student, or event..."
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
            <option value="Technical competition">Technical Competition</option>
            <option value="Hackathon">Hackathon</option>
            <option value="Project exhibition">Project Exhibition</option>
            <option value="Coding contest">Coding Contest</option>
            <option value="Workshop">Workshop</option>
            <option value="Club accomplishment">Club Accomplishment</option>
          </select>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 rounded-xl bg-[#111827] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#273449] transition-colors shadow-2xs"
          >
            <Plus className="h-4 w-4" />
            <span>Add Achievement</span>
          </button>
        </div>
      </div>

      {/* Achievements Table */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#64748B]" />
          </div>
        ) : achievements.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-[#111827]">No achievements found</p>
            <p className="text-xs text-[#64748B] mt-1">
              Add your first achievement or adjust filters.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#111827] px-3.5 py-2 text-xs font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Achievement</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-semibold uppercase text-[#64748B]">
                <tr>
                  <th className="px-5 py-3.5">Title & Student/Team</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Competition / Award</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {achievements.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                    <td className="px-5 py-4 font-semibold text-[#111827]">
                      <div className="max-w-md">
                        <p className="truncate text-[13px]">{item.title}</p>
                        <p className="text-[11px] text-[#64748B] font-normal truncate mt-0.5">
                          {item.studentOrTeamName || 'Nexora ISE Team'}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700 border border-purple-100">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#64748B]">
                      <div className="font-medium text-[#111827]">
                        {item.awardOrPosition || 'Verified'}
                      </div>
                      <div className="text-[11px] text-[#94A3B8] truncate max-w-[180px]">
                        {item.competitionOrEvent || 'Campus Technical Event'}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[#64748B]">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Calendar className="h-3 w-3 text-[#94A3B8]" />
                        <span>{item.dateDisplay || '2026'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          item.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          title="Edit achievement"
                          className="rounded-lg p-1.5 text-[#64748B] hover:bg-[#EEF2F6] hover:text-[#111827] transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.title)}
                          title="Delete achievement"
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl border border-[#E2E8F0]">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-5">
              <h3 className="text-base font-bold text-[#111827]">
                {editingItem ? 'Edit Achievement' : 'Add New Achievement'}
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
                    Achievement Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. 1st Place at VTU State Level Hackathon"
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
                    <option value="Technical competition">Technical Competition</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Project exhibition">Project Exhibition</option>
                    <option value="Coding contest">Coding Contest</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Club accomplishment">Club Accomplishment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    Status
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

                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    Student or Team Name
                  </label>
                  <input
                    type="text"
                    value={formData.studentOrTeamName}
                    onChange={(e) => setFormData({ ...formData, studentOrTeamName: e.target.value })}
                    placeholder="e.g. Nexora AI Research Team"
                    className="w-full rounded-xl border border-[#DCE2EA] px-3.5 py-2.5 text-xs text-[#111827] focus:border-[#647FEA] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    Award or Position
                  </label>
                  <input
                    type="text"
                    value={formData.awardOrPosition}
                    onChange={(e) => setFormData({ ...formData, awardOrPosition: e.target.value })}
                    placeholder="e.g. 1st Place / State Champions"
                    className="w-full rounded-xl border border-[#DCE2EA] px-3.5 py-2.5 text-xs text-[#111827] focus:border-[#647FEA] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    Competition / Event Name
                  </label>
                  <input
                    type="text"
                    value={formData.competitionOrEvent}
                    onChange={(e) => setFormData({ ...formData, competitionOrEvent: e.target.value })}
                    placeholder="e.g. Smart India Hackathon Regional"
                    className="w-full rounded-xl border border-[#DCE2EA] px-3.5 py-2.5 text-xs text-[#111827] focus:border-[#647FEA] focus:outline-none"
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
                    placeholder="e.g. March 2026"
                    className="w-full rounded-xl border border-[#DCE2EA] px-3.5 py-2.5 text-xs text-[#111827] focus:border-[#647FEA] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Summary of the project or victory..."
                    className="w-full rounded-xl border border-[#DCE2EA] px-3.5 py-2 text-xs text-[#111827] focus:border-[#647FEA] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    Certificate or Trophy Image
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="Image URL or upload..."
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
                  <span>{editingItem ? 'Save Changes' : 'Add Achievement'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
