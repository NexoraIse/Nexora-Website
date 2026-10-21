'use client'

import React, { useEffect, useState } from 'react'
import { AlertCircle, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import AdminDashboard from '@/components/admin/AdminDashboard'

interface AdminUser {
  id: string
  email: string
  name?: string | null
  role: string
}

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Login form state (email and password only)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberEmail, setRememberEmail] = useState(true)
  const [msg, setMsg] = useState('')

  async function checkAdmin() {
    try {
      // 1. Check server-side admin session
      const res = await fetch('/api/admin/session', { cache: 'no-store' })
      const sessionData = await res.json()

      if (sessionData.authenticated && sessionData.user) {
        setAdminUser(sessionData.user)
        setIsAdmin(true)
        setLoading(false)
        return
      }

      // 2. Fallback check client-side Supabase auth
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.email) {
        setAdminUser({
          id: user.id,
          email: user.email,
          role: 'ADMIN',
        })
        setIsAdmin(true)
        setLoading(false)
        return
      }

      setIsAdmin(false)
    } catch (err: unknown) {
      console.error('Error checking admin status:', err)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAdmin()
    // Load remembered email if supported & saved
    const savedEmail = localStorage.getItem('remembered_admin_email')
    if (savedEmail) {
      setEmail(savedEmail)
    }
  }, [])

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    setSubmitting(true)

    if (rememberEmail) {
      localStorage.setItem('remembered_admin_email', email)
    } else {
      localStorage.removeItem('remembered_admin_email')
    }

    try {
      // Authenticate via backend API with email and hashed password
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setMsg(data.error || 'Invalid email or password.')
        setSubmitting(false)
        return
      }

      // Sync Supabase client session in background for storage uploads
      supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      }).catch(() => {})

      // Transition to admin dashboard
      setAdminUser(
        data.user || {
          id: 'admin',
          email: email.trim(),
          role: 'ADMIN',
        }
      )
      setIsAdmin(true)
      setMsg('')
    } catch (err: unknown) {
      console.error('Login request failed:', err)
      setMsg('Network error while connecting to server. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function logout() {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
    } catch {}
    await supabase.auth.signOut().catch(() => {})
    setIsAdmin(false)
    setAdminUser(null)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#F3F5F9]">
        <div className="flex items-center gap-3 rounded-[16px] bg-white px-6 py-4 shadow-sm border border-[#E2E8F0]">
          <Loader2 className="h-5 w-5 animate-spin text-[#111827]" />
          <span className="text-sm font-semibold text-[#111827]">Verifying session...</span>
        </div>
      </div>
    )
  }

  // Modern Enterprise Admin Login Interface (Email and Password only)
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#F3F5F9] p-4 sm:p-6 lg:p-8 font-sans antialiased text-[#111827]">
        <div className="w-full max-w-[480px] rounded-[26px] bg-[#FFFFFF] p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.05),0_1px_3px_rgba(15,23,42,0.03)] border border-[#E2E8F0] transition-all">
          
          {/* Header Section */}
          <div>
            <h1 className="text-[30px] sm:text-[32px] font-bold tracking-tight text-[#111827] leading-tight">
              Welcome back
            </h1>
            <p className="mt-2 text-sm sm:text-[15px] leading-relaxed text-[#64748B]">
              Sign in to access your administration dashboard.
            </p>
          </div>
          {/* Login Form */}
          <form onSubmit={login} className="mt-6 space-y-5">
            {/* Error Message Box */}
            {msg && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-[14px] border border-[#FECACA] bg-[#FEF2F2] p-3.5 text-xs sm:text-[13px] font-medium text-[#B91C1C] transition-all animate-in fade-in duration-200"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-[#B91C1C] mt-0.5" />
                <div className="flex-1 leading-snug">{msg}</div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-email"
                className="block text-xs sm:text-[13px] font-semibold text-[#111827]"
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@ajiet.edu.in"
                  className="w-full h-[52px] rounded-[14px] border border-[#DCE2EA] bg-[#FFFFFF] px-4 text-sm font-medium text-[#111827] placeholder:text-[#94A3B8] transition-colors focus:border-[#647FEA] focus:outline-none focus:ring-4 focus:ring-[#647FEA]/15"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-password"
                className="block text-xs sm:text-[13px] font-semibold text-[#111827]"
              >
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-[52px] rounded-[14px] border border-[#DCE2EA] bg-[#FFFFFF] px-4 pr-12 text-sm font-medium text-[#111827] placeholder:text-[#94A3B8] transition-colors focus:border-[#647FEA] focus:outline-none focus:ring-4 focus:ring-[#647FEA]/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-4 p-1 text-[#64748B] hover:text-[#111827] transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Email Checkbox */}
            <div className="flex items-center pt-0.5">
              <label
                htmlFor="remember-email"
                className="group flex cursor-pointer items-center gap-2.5 select-none"
              >
                <div className="relative flex items-center">
                  <input
                    id="remember-email"
                    type="checkbox"
                    checked={rememberEmail}
                    onChange={(e) => setRememberEmail(e.target.checked)}
                    className="peer h-4 w-4 rounded-[4px] border border-[#CBD5E1] bg-white text-[#111827] transition-all focus:ring-2 focus:ring-[#647FEA]/20 focus:ring-offset-0 focus:outline-none checked:border-[#111827] checked:bg-[#111827]"
                  />
                </div>
                <span className="text-xs sm:text-[13px] font-medium text-[#475569] group-hover:text-[#111827] transition-colors">
                  Remember email
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#111827] px-6 text-sm sm:text-[15px] font-semibold text-white shadow-sm transition-all duration-150 hover:bg-[#273449] focus:outline-none focus:ring-4 focus:ring-[#111827]/15 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Login</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // Complete Enterprise Admin Dashboard for logged-in admin
  return (
    <AdminDashboard
      user={
        adminUser || {
          id: 'admin',
          email,
          role: 'ADMIN',
        }
      }
      onLogout={logout}
    />
  )
}