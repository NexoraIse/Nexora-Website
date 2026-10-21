'use client'

import React from 'react'
import { Check, X, Shield, ShieldAlert, ShieldCheck } from 'lucide-react'

export default function RolesView() {
  const permissions = [
    { name: 'View Overview & Metrics', superAdmin: true, admin: true, editor: true },
    { name: 'Create & Edit Events', superAdmin: true, admin: true, editor: true },
    { name: 'Delete Events', superAdmin: true, admin: true, editor: false },
    { name: 'Manage Achievements', superAdmin: true, admin: true, editor: true },
    { name: 'Manage Learning Hub & Materials', superAdmin: true, admin: true, editor: true },
    { name: 'Manage Content Categories', superAdmin: true, admin: true, editor: false },
    { name: 'View Audit Logs', superAdmin: true, admin: true, editor: false },
    { name: 'Inspect & Revoke Active Sessions', superAdmin: true, admin: true, editor: false },
    { name: 'Create & Delete Admin Accounts', superAdmin: true, admin: false, editor: false },
    { name: 'Configure System Settings', superAdmin: true, admin: true, editor: false },
  ]

  return (
    <div className="space-y-6">
      {/* Intro Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center gap-2 text-purple-700">
            <ShieldAlert className="h-5 w-5" />
            <h3 className="text-sm font-bold">SUPER_ADMIN</h3>
          </div>
          <p className="mt-2 text-xs text-[#64748B] leading-relaxed">
            Unrestricted administrative authority. Capable of provisioning new administrators, modifying roles, revoking sessions, and modifying all content streams.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center gap-2 text-blue-700">
            <ShieldCheck className="h-5 w-5" />
            <h3 className="text-sm font-bold">ADMIN</h3>
          </div>
          <p className="mt-2 text-xs text-[#64748B] leading-relaxed">
            Full operational control over club events, achievements, and academic study materials. Can inspect audit logs and active sessions.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Shield className="h-5 w-5" />
            <h3 className="text-sm font-bold">EDITOR</h3>
          </div>
          <p className="mt-2 text-xs text-[#64748B] leading-relaxed">
            Content contributor authorization. Can author drafts, update published content, and upload learning resources without deletion or user management rights.
          </p>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-[#F1F5F9]">
          <h3 className="text-sm font-bold text-[#111827]">Permissions Matrix</h3>
          <p className="text-xs text-[#64748B]">
            Granular access controls enforced server-side via JWT and session validation.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-semibold uppercase text-[#64748B]">
              <tr>
                <th className="px-5 py-3.5">Permission / Resource Capability</th>
                <th className="px-5 py-3.5 text-center">EDITOR</th>
                <th className="px-5 py-3.5 text-center">ADMIN</th>
                <th className="px-5 py-3.5 text-center">SUPER_ADMIN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {permissions.map((perm) => (
                <tr key={perm.name} className="hover:bg-[#F8FAFC]/80 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-[#111827]">{perm.name}</td>
                  <td className="px-5 py-3.5 text-center">
                    {perm.editor ? (
                      <Check className="mx-auto h-4 w-4 text-emerald-600" />
                    ) : (
                      <X className="mx-auto h-4 w-4 text-slate-300" />
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {perm.admin ? (
                      <Check className="mx-auto h-4 w-4 text-emerald-600" />
                    ) : (
                      <X className="mx-auto h-4 w-4 text-slate-300" />
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {perm.superAdmin ? (
                      <Check className="mx-auto h-4 w-4 text-emerald-600" />
                    ) : (
                      <X className="mx-auto h-4 w-4 text-slate-300" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
