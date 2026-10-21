'use client'

import React, { useEffect, useState } from 'react'
import { Laptop, Trash2, Loader2, RefreshCw } from 'lucide-react'

interface SessionItem {
  id: string
  adminEmail: string
  userAgent?: string | null
  ipAddress?: string | null
  expiresAt: string
  createdAt: string
}

export default function SessionsView() {
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [loading, setLoading] = useState(true)

  async function loadSessions() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/active-sessions')
      const data = await res.json()
      if (res.ok && data.sessions) {
        setSessions(data.sessions)
      }
    } catch (err) {
      console.error('Failed to load active sessions:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [])

  async function handleRevoke(id: string, email: string) {
    if (!confirm(`Revoke this session for ${email}? The user will be required to sign in again.`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/active-sessions?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        loadSessions()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to revoke session.')
      }
    } catch {
      alert('Network error while revoking session.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-white p-4 sm:p-5 border border-[#E2E8F0] shadow-2xs">
        <div>
          <h2 className="text-sm font-bold text-[#111827]">Active Authenticated Sessions</h2>
          <p className="text-xs text-[#64748B]">
            Currently valid cryptographic session tokens tracked in PostgreSQL.
          </p>
        </div>

        <button
          onClick={loadSessions}
          className="flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9]"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#64748B]" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#64748B]">No active sessions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-semibold uppercase text-[#64748B]">
                <tr>
                  <th className="px-5 py-3.5">Admin Account</th>
                  <th className="px-5 py-3.5">IP Address</th>
                  <th className="px-5 py-3.5">Device / User Agent</th>
                  <th className="px-5 py-3.5">Logged In At</th>
                  <th className="px-5 py-3.5 text-right">Revoke</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                    <td className="px-5 py-4 font-semibold text-[#111827]">
                      {session.adminEmail}
                    </td>
                    <td className="px-5 py-4 text-[#475569]">
                      {session.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="px-5 py-4 text-[#64748B] max-w-xs truncate">
                      {session.userAgent || 'Web Browser'}
                    </td>
                    <td className="px-5 py-4 text-[#94A3B8]">
                      {new Date(session.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleRevoke(session.id, session.adminEmail)}
                        title="Revoke session"
                        className="rounded-lg p-1.5 text-[#64748B] hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
