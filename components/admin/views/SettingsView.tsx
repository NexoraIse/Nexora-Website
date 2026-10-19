'use client'

import React from 'react'
import { ShieldCheck, Database, Server, LogOut, CheckCircle2 } from 'lucide-react'

interface SettingsViewProps {
  userEmail: string
  userRole: string
  userName?: string | null
  onLogout: () => void
}

export default function SettingsView({
  userEmail,
  userRole,
  userName,
  onLogout,
}: SettingsViewProps) {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Account Info Card */}
      <div className="rounded-2xl bg-white p-6 border border-[#E2E8F0] shadow-2xs">
        <div className="flex items-center gap-3 border-b border-[#F1F5F9] pb-4 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-sm">
            {userEmail.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="text-base font-bold text-[#111827]">
              {userName || 'Nexora Administrator'}
            </h3>
            <p className="text-xs text-[#64748B]">{userEmail}</p>
          </div>
          <span className="ml-auto rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-100">
            {userRole}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
          <div>
            <span className="text-[#64748B]">Authentication Mechanism:</span>
            <p className="font-semibold text-[#111827] mt-0.5">
              Email + Bcrypt Hash + HMAC-SHA256 JWT
            </p>
          </div>
          <div>
            <span className="text-[#64748B]">Session Lifespan:</span>
            <p className="font-semibold text-[#111827] mt-0.5">
              7 Days (HttpOnly, Secure, SameSite)
            </p>
          </div>
          <div>
            <span className="text-[#64748B]">Audit Log Retention:</span>
            <p className="font-semibold text-[#111827] mt-0.5">
              Permanent (Indefinite · No Auto-Delete)
            </p>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-[#F1F5F9] flex justify-end">
          <button
            onClick={onLogout}
            className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out of session</span>
          </button>
        </div>
      </div>

      {/* Database & Infrastructure Health */}
      <div className="rounded-2xl bg-white p-6 border border-[#E2E8F0] shadow-2xs">
        <h3 className="text-sm font-bold text-[#111827] mb-4">Infrastructure & Connectivity</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-[#F8FAFC] p-3.5 border border-[#E2E8F0] text-xs">
            <div className="flex items-center gap-3">
              <Database className="h-4 w-4 text-emerald-600" />
              <div>
                <p className="font-semibold text-[#111827]">PostgreSQL on Supabase</p>
                <p className="text-[11px] text-[#64748B]">Connected via Prisma ORM singleton</p>
              </div>
            </div>
            <span className="flex items-center gap-1 font-semibold text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> Healthy
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-[#F8FAFC] p-3.5 border border-[#E2E8F0] text-xs">
            <div className="flex items-center gap-3">
              <Server className="h-4 w-4 text-blue-600" />
              <div>
                <p className="font-semibold text-[#111827]">Storage Bucket Service</p>
                <p className="text-[11px] text-[#64748B]">
                  Supabase S3-compatible asset store (`notice-images`, `event-posters`)
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1 font-semibold text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> Operational
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
