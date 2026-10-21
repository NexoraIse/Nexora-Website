'use client'

import React, { useEffect, useState } from 'react'
import { Plus, Trash2, Users, Shield, Loader2, X, AlertCircle } from 'lucide-react'

interface AdminUserItem {
  id: string
  email: string
  name?: string | null
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR'
  createdAt: string
}

interface AdminUsersViewProps {
  currentUserRole: string
  currentUserId: string
}

export default function AdminUsersView({
  currentUserRole,
  currentUserId,
}: AdminUsersViewProps) {
  const [users, setUsers] = useState<AdminUserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'ADMIN' | 'EDITOR' | 'SUPER_ADMIN'>('ADMIN')
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState('')

  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN'

  async function loadUsers() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (res.ok && data.admins) {
        setUsers(data.admins)
      }
    } catch (err) {
      console.error('Failed to load admin users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setMsg('')

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg(data.error || 'Failed to create admin.')
        return
      }

      setEmail('')
      setPassword('')
      setName('')
      setIsModalOpen(false)
      loadUsers()
    } catch {
      setMsg('Network error while creating admin.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string, userEmail: string) {
    if (id === currentUserId) {
      alert('You cannot delete your own account.')
      return
    }
    if (!confirm(`Are you sure you want to revoke and delete admin "${userEmail}"?`)) return

    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        loadUsers()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete admin.')
      }
    } catch {
      alert('Network error while deleting admin.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-white p-4 sm:p-5 border border-[#E2E8F0] shadow-2xs">
        <div>
          <h2 className="text-sm font-bold text-[#111827]">Administrator Accounts</h2>
          <p className="text-xs text-[#64748B]">
            Users authorized to access this administration console.
          </p>
        </div>

        {isSuperAdmin ? (
          <button
            onClick={() => {
              setMsg('')
              setIsModalOpen(true)
            }}
            className="flex items-center gap-1.5 rounded-xl bg-[#111827] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#273449] transition-colors shadow-2xs"
          >
            <Plus className="h-4 w-4" />
            <span>Add Admin</span>
          </button>
        ) : (
          <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
            Read-only mode (Super Admin required to add accounts)
          </span>
        )}
      </div>

      <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#64748B]" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#64748B]">No admins found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-semibold uppercase text-[#64748B]">
                <tr>
                  <th className="px-5 py-3.5">Administrator</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Created</th>
                  {isSuperAdmin && <th className="px-5 py-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                    <td className="px-5 py-4 font-semibold text-[#111827]">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 font-bold text-[11px] text-indigo-700">
                          {u.email.slice(0, 2).toUpperCase()}
                        </div>
                        <span>{u.name || 'Admin User'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[#475569]">{u.email}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : u.role === 'ADMIN'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#94A3B8]">
                      {new Date(u.createdAt).toISOString().slice(0, 10)}
                    </td>
                    {isSuperAdmin && (
                      <td className="px-5 py-4 text-right">
                        {u.id !== currentUserId && (
                          <button
                            onClick={() => handleDelete(u.id, u.email)}
                            title="Delete admin account"
                            className="rounded-lg p-1.5 text-[#64748B] hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-[#E2E8F0]">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-4">
              <h3 className="text-base font-bold text-[#111827]">Create Administrator Account</h3>
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

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ISE Department Head"
                  className="w-full rounded-xl border border-[#DCE2EA] px-3.5 py-2.5 text-xs text-[#111827] focus:border-[#647FEA] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. staff.ise@ajiet.edu.in"
                  className="w-full rounded-xl border border-[#DCE2EA] px-3.5 py-2.5 text-xs text-[#111827] focus:border-[#647FEA] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Initial Password (min 6 chars) *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#DCE2EA] px-3.5 py-2.5 text-xs text-[#111827] focus:border-[#647FEA] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Role Permission *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full rounded-xl border border-[#DCE2EA] px-3.5 py-2.5 text-xs text-[#111827] focus:border-[#647FEA] focus:outline-none"
                >
                  <option value="ADMIN">ADMIN (Full content & settings management)</option>
                  <option value="EDITOR">EDITOR (Content creation & editing only)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Full access including admin management)</option>
                </select>
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
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
