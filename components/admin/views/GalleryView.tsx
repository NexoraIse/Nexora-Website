'use client'

import React, { useEffect, useState, useRef } from 'react'
import {
  Search,
  Plus,
  Trash2,
  Image as ImageIcon,
  Loader2,
  X,
  Upload,
  Calendar,
  MapPin,
  ExternalLink,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import type { GalleryItem } from '@/lib/home-gallery'

interface GalleryViewProps {
  initialOpenModal?: boolean
}

export default function GalleryView({ initialOpenModal = false }: GalleryViewProps) {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(initialOpenModal)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [msg, setMsg] = useState('')
  const [isCloudinaryConfigured, setIsCloudinaryConfigured] = useState(false)
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState<string | null>(null)
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: '',
    category: 'Workshop',
    caption: '',
    date: 'March 2026',
    location: 'AJIET Mangaluru',
    src: '',
    alt: '',
    aspectRatio: 'aspect-[16/9]',
  })

  async function loadItems() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/gallery', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) {
        setItems(data.items || [])
        setIsCloudinaryConfigured(Boolean(data.isCloudinaryConfigured))
        setCloudinaryCloudName(data.cloudinaryCloudName || null)
      }
    } catch (err) {
      console.error('Failed to load gallery items:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  useEffect(() => {
    if (initialOpenModal) {
      setIsModalOpen(true)
    }
  }, [initialOpenModal])

  function resetForm() {
    setFormData({
      title: '',
      category: 'Workshop',
      caption: '',
      date: 'March 2026',
      location: 'AJIET Mangaluru',
      src: '',
      alt: '',
      aspectRatio: 'aspect-[16/9]',
    })
    setMsg('')
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingImage(true)
      setMsg('')
      const uploadData = new FormData()
      uploadData.append('file', file)
      uploadData.append('bucket', 'gallery')

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadData,
      })

      const data = await res.json()
      if (res.ok && data.url) {
        setFormData((prev) => ({
          ...prev,
          src: data.url,
          title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          alt: prev.alt || file.name.replace(/\.[^/.]+$/, ''),
        }))
        if (data.storage === 'cloudinary') {
          setMsg('✓ Image successfully uploaded and stored in Cloudinary!')
        } else {
          setMsg(`✓ Image uploaded successfully (${data.storage} storage).`)
        }
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
    if (!formData.title || !formData.src) {
      alert('Please provide a title and image.')
      return
    }

    setSubmitting(true)
    setMsg('')

    try {
      const res = await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (res.ok) {
        setIsModalOpen(false)
        resetForm()
        loadItems()
      } else {
        setMsg(data.error || 'Failed to save gallery item.')
      }
    } catch {
      setMsg('Network error while saving photo.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to remove this photo from the gallery?')) {
      return
    }

    try {
      const res = await fetch(`/api/admin/gallery?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (res.ok) {
        loadItems()
      } else {
        alert(data.error || 'Failed to remove item.')
      }
    } catch {
      alert('Network error while deleting photo.')
    }
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      search === '' ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.caption.toLowerCase().includes(search.toLowerCase()) ||
      (item.location && item.location.toLowerCase().includes(search.toLowerCase()))
    const matchesCategory =
      categoryFilter === '' ||
      item.category.toLowerCase() === categoryFilter.toLowerCase()
    return matchesSearch && matchesCategory
  })

  const uniqueCategories = Array.from(new Set(items.map((it) => it.category).filter(Boolean)))

  return (
    <div className="space-y-6">
      {/* Top Banner / Cloudinary Status */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-white p-5 border border-[#E2E8F0] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#111827]">Photo Gallery Management</h2>
            {isCloudinaryConfigured ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <Cloud className="h-3 w-3" />
                Cloudinary Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                <Cloud className="h-3 w-3" />
                Cloudinary Not Configured
              </span>
            )}
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            {isCloudinaryConfigured
              ? `Images uploaded here are automatically compressed, optimized, and hosted on Cloudinary (${cloudinaryCloudName}).`
              : 'Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env for direct cloud hosting.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadItems}
            className="flex items-center gap-1.5 rounded-xl border border-[#CBD5E1] bg-white px-3 py-2 text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC] transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              resetForm()
              setIsModalOpen(true)
            }}
            className="flex items-center gap-1.5 rounded-xl bg-[#111827] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#273449] transition-colors shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Photo to Gallery</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-white p-3 border border-[#E2E8F0]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search moments by title, caption, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-[#CBD5E1] focus:outline-none focus:border-[#111827]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-lg border border-[#CBD5E1] focus:outline-none focus:border-[#111827] bg-white text-[#334155]"
          >
            <option value="">All Categories ({items.length})</option>
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Gallery Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-[#E2E8F0]">
          <Loader2 className="h-8 w-8 animate-spin text-[#111827]" />
          <p className="mt-3 text-sm text-[#64748B]">Loading gallery photos...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-[#E2E8F0] text-center">
          <ImageIcon className="h-10 w-10 text-[#CBD5E1]" />
          <p className="mt-3 font-semibold text-[#111827]">No gallery photos found</p>
          <p className="text-xs text-[#64748B] mt-1 max-w-sm">
            {search || categoryFilter
              ? 'Try adjusting your search filters.'
              : 'Add your first event photo using the "Add Photo to Gallery" button.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const isCloudinaryUrl = item.src.includes('cloudinary.com')
            const isCustom = item.id.startsWith('gal-custom')

            return (
              <div
                key={item.id}
                className="group relative flex flex-col overflow-hidden rounded-xl bg-white border border-[#E2E8F0] shadow-2xs hover:shadow-md hover:border-[#94A3B8] transition-all"
              >
                {/* Image Thumbnail */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                  <img
                    src={item.src}
                    alt={item.alt}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span className="rounded-md bg-black/75 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white border border-white/20">
                      {item.category}
                    </span>
                    {isCloudinaryUrl && (
                      <span className="rounded-md bg-blue-600/85 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-semibold text-white inline-flex items-center gap-0.5">
                        <Cloud className="h-2.5 w-2.5" />
                        Cloudinary
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      aria-label="Preview photo"
                      className="p-1.5 rounded-lg bg-black/70 text-white hover:bg-black transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col p-3.5">
                  <h3 className="font-bold text-sm text-[#111827] line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-[#64748B] line-clamp-2 leading-relaxed flex-1">
                    {item.caption || item.alt}
                  </p>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#F1F5F9] text-[11px] text-[#64748B]">
                    <span className="flex items-center gap-1 font-mono text-[10px]">
                      <Calendar className="h-3 w-3 text-[#94A3B8]" />
                      {item.date}
                    </span>

                    {isCustom ? (
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-700 font-semibold inline-flex items-center gap-1 text-[11px]"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    ) : (
                      <span className="text-[10px] text-[#94A3B8] font-mono">SEEDED</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Photo Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-[#CBD5E1]">
            <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9]">
              <div>
                <h3 className="text-base font-bold text-[#111827]">
                  Add Photo to Homepage Gallery
                </h3>
                <p className="text-xs text-[#64748B]">
                  Images uploaded here are stored in Cloudinary and immediately published to the moving gallery.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#111827]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {msg && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    msg.startsWith('✓')
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {msg.startsWith('✓') ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  )}
                  <span>{msg}</span>
                </div>
              )}

              {/* Upload to Cloudinary File Box */}
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                  Photo Asset (Cloudinary Upload) *
                </label>
                <div className="rounded-xl border-2 border-dashed border-[#CBD5E1] p-4 text-center hover:border-[#111827] transition-colors bg-[#F8FAFC]">
                  {formData.src ? (
                    <div className="space-y-3">
                      <div className="relative mx-auto aspect-[16/9] max-w-xs overflow-hidden rounded-lg bg-black">
                        <img
                          src={formData.src}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xs text-[#10b981] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {formData.src.includes('cloudinary.com')
                            ? 'Stored on Cloudinary'
                            : 'Image Ready'}
                        </span>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs text-[#475569] underline hover:text-[#111827]"
                        >
                          Change Photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-2xs border border-[#E2E8F0] text-[#111827]">
                        {uploadingImage ? (
                          <Loader2 className="h-5 w-5 animate-spin text-[#111827]" />
                        ) : (
                          <Upload className="h-5 w-5" />
                        )}
                      </div>
                      <p className="mt-2 text-xs font-semibold text-[#111827]">
                        {uploadingImage
                          ? 'Uploading & storing in Cloudinary...'
                          : 'Click to upload image to Cloudinary'}
                      </p>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        Supports JPG, PNG, WebP, SVG up to 10 MB
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#111827] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#273449] disabled:opacity-50"
                      >
                        <Cloud className="h-3.5 w-3.5" />
                        <span>Select File &amp; Upload</span>
                      </button>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Direct Image URL input */}
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Image URL / Cloudinary CDN Path *
                </label>
                <input
                  type="text"
                  placeholder="https://res.cloudinary.com/... or /gallery/photo.svg"
                  value={formData.src}
                  onChange={(e) => setFormData((prev) => ({ ...prev, src: e.target.value }))}
                  required
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[#CBD5E1] focus:outline-none focus:border-[#111827]"
                />
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    Photo Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AI & Vision Workshop"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#CBD5E1] focus:outline-none focus:border-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    Event Category
                  </label>
                  <input
                    type="text"
                    list="category-suggestions"
                    placeholder="e.g. Workshop, Hackathon, Community"
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#CBD5E1] focus:outline-none focus:border-[#111827]"
                  />
                  <datalist id="category-suggestions">
                    <option value="Workshop" />
                    <option value="Hackathon" />
                    <option value="Technical Fest" />
                    <option value="Competition" />
                    <option value="Exhibition" />
                    <option value="Community" />
                  </datalist>
                </div>
              </div>

              {/* Caption */}
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Caption / Description
                </label>
                <textarea
                  rows={2}
                  placeholder="A short description of what happened in this moment..."
                  value={formData.caption}
                  onChange={(e) => setFormData((prev) => ({ ...prev, caption: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#CBD5E1] focus:outline-none focus:border-[#111827]"
                />
              </div>

              {/* Date & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    Date
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. March 2026"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#CBD5E1] focus:outline-none focus:border-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Central Lab, AJIET"
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#CBD5E1] focus:outline-none focus:border-[#111827]"
                  />
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Mosaic Card Aspect Ratio
                </label>
                <select
                  value={formData.aspectRatio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, aspectRatio: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#CBD5E1] focus:outline-none focus:border-[#111827] bg-white text-[#334155]"
                >
                  <option value="aspect-[16/9]">16:9 Landscape (Standard)</option>
                  <option value="aspect-[4/3]">4:3 Classic Photo</option>
                  <option value="aspect-[3/2]">3:2 Medium Format</option>
                  <option value="aspect-square">1:1 Square</option>
                  <option value="aspect-[21/9]">21:9 Ultra-Wide Cinematic</option>
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9] rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#111827] px-4 py-2 text-xs font-semibold text-white hover:bg-[#273449] transition-colors disabled:opacity-50 shadow-2xs"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save to Gallery</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Preview Modal */}
      {previewItem && (
        <div
          onClick={() => setPreviewItem(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono text-cyan-400 font-semibold">
                {previewItem.category}
              </span>
              <button
                onClick={() => setPreviewItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="py-4">
              <img
                src={previewItem.src}
                alt={previewItem.alt}
                className="max-h-[60vh] w-auto mx-auto object-contain rounded-lg"
              />
            </div>
            <div className="pt-2 text-slate-200">
              <h4 className="font-bold text-sm text-white">{previewItem.title}</h4>
              <p className="text-xs text-slate-400 mt-1">{previewItem.caption}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

