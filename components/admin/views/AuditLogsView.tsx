'use client'

import React, { useEffect, useState } from 'react'
import { Activity, Loader2, RefreshCw } from 'lucide-react'

interface AuditLogItem {
  id: string
  action: string
  entity: string
  entityId?: string | null
  details?: string | null
  ipAddress?: string | null
  createdAt: string
  admin?: {
    email: string
    name?: string | null
    role: string
  } | null
}

export default function AuditLogsView() {
  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [entityFilter, setEntityFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  async function loadLogs() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (entityFilter) params.set('entity', entityFilter)
      if (actionFilter) params.set('action', actionFilter)
      params.set('limit', '50')

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`)
      const data = await res.json()
      if (res.ok && data.logs) {
        setLogs(data.logs)
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [entityFilter, actionFilter])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-white p-4 sm:p-5 border border-[#E2E8F0] shadow-2xs">
        <div>
          <h2 className="text-sm font-bold text-[#111827]">Security & Activity Audit Logs</h2>
          <p className="text-xs text-[#64748B]">
            Permanent immutable forensic audit trail. Logs are stored indefinitely with no auto-deletion.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#475569] focus:outline-none"
          >
            <option value="">All Entities</option>
            <option value="Event">Event</option>
            <option value="Achievement">Achievement</option>
            <option value="LearningResource">Learning Resource</option>
            <option value="Category">Category</option>
            <option value="Admin">Admin</option>
            <option value="Session">Session</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#475569] focus:outline-none"
          >
            <option value="">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="REVOKE_SESSION">REVOKE_SESSION</option>
          </select>

          <button
            onClick={loadLogs}
            className="flex items-center justify-center rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-[#475569] hover:bg-[#F1F5F9]"
            title="Refresh logs"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#64748B]" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#64748B]">No audit events recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-semibold uppercase text-[#64748B]">
                <tr>
                  <th className="px-5 py-3.5">Action</th>
                  <th className="px-5 py-3.5">Entity</th>
                  <th className="px-5 py-3.5">Details</th>
                  <th className="px-5 py-3.5">Admin Account</th>
                  <th className="px-5 py-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          log.action === 'CREATE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : log.action === 'UPDATE'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : log.action === 'DELETE'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[#111827]">
                      {log.entity}
                    </td>
                    <td className="px-5 py-3.5 text-[#475569] max-w-sm truncate">
                      {log.details || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-[#64748B]">
                      {log.admin?.email || 'System'}
                    </td>
                    <td className="px-5 py-3.5 text-right text-[#94A3B8]">
                      {new Date(log.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
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
