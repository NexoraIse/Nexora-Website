'use client'

import React, { useEffect, useState } from 'react'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  FileText,
  ExternalLink,
  Loader2,
  X,
  Upload,
} from 'lucide-react'

interface ResourceItem {
  id: string
  title: string
  subject: string
  semester?: number | null
  academicYear?: string | null
  category: string
  resourceType: string
  fileUrl?: string | null
  description: string
  tags: string[]
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'
  createdAt: string
}

interface LearningHubViewProps {
  initialOpenModal?: boolean
}

export default function LearningHubView({ initialOpenModal = false }: LearningHubViewProps) {
  const [resources, setResources] = useState<ResourceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(initialOpenModal)
  const [editingItem, setEditingItem] = useState<ResourceItem | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [msg, setMsg] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    subject: 'Data Structures & Applications',
    semester: 3,
    category: 'notes',
    resourceType: 'PDF',
    description: '',
    fileUrl: '',
    tags: 'Notes, VTU, DSA',
    status: 'PUBLISHED' as 'PUBLISHED' | 'DRAFT' | 'ARCHIVED',
  })

  async function loadResources() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (semesterFilter) params.set('semester', semesterFilter)
      if (categoryFilter) params.set('category', categoryFilter)

      const res = await fetch(`/api/admin/resources?${params.toString()}`)
      const data = await res.json()
      if (res.ok && data.resources) {
        setResources(data.resources)
      }
    } catch (err) {
      console.error('Failed to load learning resources:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResources()
  }, [semesterFilter, categoryFilter])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    loadResources()
  }

  function openCreateModal() {
    setEditingItem(null)
    setFormData({
      title: '',
      subject: 'Data Structures & Applications',
      semester: 3,
      category: 'notes',
      resourceType: 'PDF',
      description: '',
      fileUrl: '',
      tags: 'Notes, VTU, DSA',
      status: 'PUBLISHED',
    })
    setMsg('')
    setIsModalOpen(true)
  }

  function openEditModal(item: ResourceItem) {
    setEditingItem(item)
    setFormData({
      title: item.title,
      subject: item.subject,
      semester: item.semester || 3,
      category: item.category,
      resourceType: item.resourceType,
      description: item.description,
      fileUrl: item.fileUrl || '',
      tags: item.tags.join(', '),
      status: item.status,
    })
    setMsg('')
    setIsModalOpen(true)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingFile(true)
      const uploadData = new FormData()
      uploadData.append('file', file)
      uploadData.append('bucket', 'learning-resources')

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadData,
      })
      const data = await res.json()
      if (res.ok && data.url) {
        setFormData((prev) => ({ ...prev, fileUrl: data.url }))
      } else {
        alert(data.error || 'Upload failed.')
      }
    } catch {
      alert('Upload failed due to network error.')
    } finally {
      setUploadingFile(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setMsg('')

    try {
      const payload = {
        ...formData,
        semester: Number(formData.semester),
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      }

      let res
      if (editingItem) {
        res = await fetch('/api/admin/resources', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingItem.id, ...payload }),
        })
      } else {
        res = await fetch('/api/admin/resources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const resData = await res.json()
      if (!res.ok) {
        setMsg(resData.error || 'Failed to save resource.')
        return
      }

      setIsModalOpen(false)
      loadResources()
    } catch (err: unknown) {
      console.error('Save resource failed:', err)
      setMsg('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete resource "${title}"?`)) return

    try {
      const res = await fetch(`/api/admin/resources?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        loadResources()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete resource.')
      }
    } catch {
      alert('Network error while deleting resource.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-white p-4 sm:p-5 border border-[#E2E8F0] shadow-2xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search study materials by subject or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-2 pl-9 pr-4 text-xs font-medium text-[#111827] placeholder-[#94A3B8] focus:border-[#647FEA] focus:bg-white focus:outline-none"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#475569] focus:outline-none"
          >
            <option value="">All Semesters</option>
            <option value="3">Semester 3</option>
            <option value="4">Semester 4</option>
            <option value="5">Semester 5</option>
            <option value="6">Semester 6</option>
            <option value="7">Semester 7</option>
            <option value="8">Semester 8</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#475569] focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="notes">Lecture Notes</option>
            <option value="question_papers">Question Papers</option>
            <option value="tutorials">Tutorials</option>
            <option value="syllabus">Syllabus</option>
          </select>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 rounded-xl bg-[#111827] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#273449] transition-colors shadow-2xs"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Material</span>
          </button>
        </div>
      </div>

      {/* Resources Table */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#64748B]" />
          </div>
        ) : resources.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-[#111827]">No study materials found</p>
            <p className="text-xs text-[#64748B] mt-1">
              Upload your first academic resource or adjust search filters.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#111827] px-3.5 py-2 text-xs font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Upload Material</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-semibold uppercase text-[#64748B]">
                <tr>
                  <th className="px-5 py-3.5">Title & Description</th>
                  <th className="px-5 py-3.5">Subject</th>
                  <th className="px-5 py-3.5">Sem</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">File Link</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {resources.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                    <td className="px-5 py-4 font-semibold text-[#111827]">
                      <div className="max-w-md">
                        <p className="truncate text-[13px]">{item.title}</p>
                        <p className="text-[11px] text-[#64748B] font-normal truncate mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-medium text-[#111827]">{item.subject}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                        Sem {item.semester || 3}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700 border border-sky-100">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {item.fileUrl ? (
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          <FileText className="h-3 w-3" />
                          <span>View {item.resourceType}</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400">No link</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          title="Edit resource"
                          className="rounded-lg p-1.5 text-[#64748B] hover:bg-[#EEF2F6] hover:text-[#111827] transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.title)}
                          title="Delete resource"
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
                {editingItem ? 'Edit Study Material' : 'Upload Study Material'}
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
                    Resource Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Operating Systems - Process Synchronization Notes"
                    className="w-full rounded-xl border border-[#DCE2EA] px-3.5 py-2.5 text-xs text-[#111827] focus:border-[#647FEA] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. Operating Systems"
                    className="w-full rounded-xl border border-[#DCE2EA] px-3.5 py-2.5 text-xs text-[#111827] focus:border-[#647FEA] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    Semester (1-8) *
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                    className="w-full rounded-xl border border-[#DCE2EA] px-3.5 py-2.5 text-xs text-[#111827] focus:border-[#647FEA] focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
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
                    <option value="notes">Notes</option>
                    <option value="question_papers">Question Papers</option>
                    <option value="tutorials">Tutorials</option>
                    <option value="syllabus">Syllabus</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    Resource Type
                  </label>
                  <select
                    value={formData.resourceType}
                    onChange={(e) => setFormData({ ...formData, resourceType: e.target.value })}
                    className="w-full rounded-xl border border-[#DCE2EA] px-3.5 py-2.5 text-xs text-[#111827] focus:border-[#647FEA] focus:outline-none"
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="DOCX">Word Document</option>
                    <option value="ZIP">Archive (ZIP)</option>
                    <option value="LINK">External Link</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of chapters covered..."
                    className="w-full rounded-xl border border-[#DCE2EA] px-3.5 py-2 text-xs text-[#111827] focus:border-[#647FEA] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    Document File Link or Upload
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.fileUrl}
                      onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                      placeholder="https://... or upload PDF below"
                      className="w-full rounded-xl border border-[#DCE2EA] px-3.5 py-2 text-xs text-[#111827] focus:border-[#647FEA] focus:outline-none"
                    />
                    <label className="cursor-pointer shrink-0 rounded-xl border border-[#DCE2EA] bg-[#F8FAFC] p-2 hover:bg-[#F1F5F9]">
                      <Upload className="h-4 w-4 text-[#64748B]" />
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                      />
                    </label>
                  </div>
                  {uploadingFile && (
                    <p className="text-[10px] text-indigo-600 mt-1">Uploading document...</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="VTU, Unit 1, Solved"
                    className="w-full rounded-xl border border-[#DCE2EA] px-3.5 py-2 text-xs text-[#111827] focus:border-[#647FEA] focus:outline-none"
                  />
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
                  <span>{editingItem ? 'Save Changes' : 'Upload Material'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
