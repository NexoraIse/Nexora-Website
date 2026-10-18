'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  CircleCheck,
  Flag,
  MessageSquareWarning,
  ShieldAlert,
  UserRound,
  UsersRound,
} from 'lucide-react'

type Tab = 'profiles' | 'reports' | 'disputes' | 'accounts'
type ReviewStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED'
type Profile = {
  authUserId: string
  slug: string
  usn: string
  fullName: string
  rosterName: string | null
  rosterNameMatches: boolean
  visibility: 'PUBLIC' | 'PRIVATE'
  graduationYear: number
  memberType: 'STUDENT' | 'ALUMNUS'
  bio: string | null
  createdAt: string
}

type Report = {
  id: string
  target: 'PROFILE' | 'KNOWLEDGE_PAGE'
  reason: string
  details: string | null
  status: ReviewStatus
  resolutionNote: string | null
  createdAt: string
  profile: { slug: string; fullName: string; usn: string }
}
type Dispute = {
  id: string
  status: ReviewStatus
  usn: string
  details: string
  resolutionNote: string | null
  createdAt: string
  claim: { profile: { fullName: string; slug: string } }
}
type ConnectAccount = {
  id: string
  email: string
  usn: string | null
  createdAt: string
  emailConfirmedAt: string | null
  disabled: boolean
  profile: { fullName: string; slug: string } | null
}
type Pagination = { page: number; limit: number; total: number; totalPages: number }

const tabs: Array<{ id: Tab; label: string; icon: typeof UsersRound }> = [
  { id: 'profiles', label: 'New profiles', icon: UsersRound },
  { id: 'reports', label: 'Reports', icon: Flag },
  { id: 'disputes', label: 'Student number help', icon: MessageSquareWarning },
  { id: 'accounts', label: 'Registered members', icon: UserRound },
]
const statusOptions: Record<Tab, string[]> = {
  profiles: ['PENDING'],
  reports: ['OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED', 'ALL'],
  disputes: ['OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED', 'ALL'],
  accounts: ['ALL', 'ACTIVE', 'UNCONFIRMED', 'DISABLED'],
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value))
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: 'New · confirmation only',
    OPEN: 'New',
    IN_REVIEW: 'Being reviewed',
    RESOLVED: 'Resolved',
    DISMISSED: 'Closed',
    ALL: 'All',
    ACTIVE: 'Active',
    DISABLED: 'Disabled',
    UNCONFIRMED: 'Email not confirmed',
  }
  return labels[status] ?? status.replaceAll('_', ' ')
}

function StatusBadge({ status }: { status: string }) {
  const tone = status === 'RESOLVED' || status === 'ACTIVE'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : status === 'DISMISSED' || status === 'DISABLED'
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : 'border-amber-200 bg-amber-50 text-amber-800'
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide ${tone}`}>{statusLabel(status)}</span>
}

function ReviewForm({
  busy,
  onSubmit,
}: {
  busy: boolean
  onSubmit: (status: string, note: string) => Promise<void>
}) {
  const [status, setStatus] = useState('IN_REVIEW')
  const [note, setNote] = useState('')
  const noteRequired = status !== 'IN_REVIEW'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit(status, note)
    setNote('')
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)_auto]">
      <select
        aria-label="Review decision"
        value={status}
        onChange={(event) => setStatus(event.target.value)}
        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-cyan-500"
      >
        {['IN_REVIEW', 'RESOLVED', 'DISMISSED'].map((option) => (
          <option key={option} value={option}>{statusLabel(option)}</option>
        ))}
      </select>
      <input
        aria-label="Note for the member"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={2000}
        required={noteRequired}
        placeholder={noteRequired ? 'Add a note for the member' : 'Optional note for the member'}
        className="h-10 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none placeholder:text-slate-400 focus:border-cyan-500"
      />
      <button
        type="submit"
        disabled={busy}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#111827] px-4 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Check size={14} /> {busy ? 'Saving…' : 'Save review'}
      </button>
    </form>
  )
}

export default function ConnectModerationView({
  onNavigateToRoster,
}: {
  onNavigateToRoster: () => void
}) {
  const [tab, setTab] = useState<Tab>('profiles')
  const [filters, setFilters] = useState<Record<Tab, string>>({
    profiles: 'PENDING',
    reports: 'OPEN',
    disputes: 'OPEN',
    accounts: 'ALL',
  })
  const [page, setPage] = useState(1)
  const [accountQuery, setAccountQuery] = useState('')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [accounts, setAccounts] = useState<ConnectAccount[]>([])
  const [canManageAccounts, setCanManageAccounts] = useState(false)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError('')
    const endpoint = tab === 'profiles' ? 'profiles' : tab
    const params = new URLSearchParams({ status: filters[tab], page: String(page), limit: '20' })
    if (tab === 'accounts' && accountQuery.trim()) params.set('q', accountQuery.trim())
    try {
      const response = await fetch(`/api/admin/connect/${endpoint}?${params}`, { cache: 'no-store', signal })
      const data = await response.json()
      if (response.status === 401 || response.status === 403) {
        setAuthorized(false)
        return
      }
      if (!response.ok) throw new Error(data.error || `Unable to load Connect ${tab}.`)
      setAuthorized(true)
      if (tab === 'profiles') setProfiles(data.profiles)
      if (tab === 'reports') setReports(data.reports)
      if (tab === 'disputes') setDisputes(data.disputes)
      if (tab === 'accounts') {
        setAccounts(data.accounts)
        setCanManageAccounts(Boolean(data.canManageAccounts))
      }
      setPagination(data.pagination)
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return
      setError(cause instanceof Error ? cause.message : `Unable to load Connect ${tab}.`)
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [accountQuery, filters, page, tab])

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => void load(controller.signal), tab === 'accounts' ? 250 : 0)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [load, tab])

  async function review(endpoint: 'reports' | 'disputes', id: string, status: string, note: string) {
    setBusyId(id)
    setError('')
    setSuccess('')
    try {
      const response = await fetch(`/api/admin/connect/${endpoint}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ id, status, resolutionNote: note || null }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'The review could not be saved.')
      setSuccess('Review saved and added to the audit log.')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The review could not be saved.')
    } finally {
      setBusyId('')
    }
  }

  async function setAccountStatus(account: ConnectAccount, status: 'ACTIVE' | 'DISABLED') {
    if (
      status === 'DISABLED' &&
      !window.confirm(`Disable Connect access for ${account.email}? Their account and profile data will be kept and can be restored later.`)
    ) return

    setBusyId(account.id)
    setError('')
    setSuccess('')
    try {
      const response = await fetch('/api/admin/connect/accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ userId: account.id, status }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not update this account.')
      setSuccess(status === 'DISABLED'
        ? 'Account access disabled. The profile and member information have been kept.'
        : 'Account access restored.')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update this account.')
    } finally {
      setBusyId('')
    }
  }

  function changeTab(next: Tab) {
    setTab(next)
    setPage(1)
    setError('')
    setSuccess('')
  }

  const count = pagination?.total ?? 0
  const totalPages = pagination?.totalPages ?? 0

  if (authorized === false) {
    return (
      <div className="px-5 py-20 text-[#111827]">
        <section className="mx-auto max-w-lg rounded-3xl border border-[#e2e8f0] bg-white p-8 text-center shadow-sm">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-700"><ShieldAlert size={22} /></span>
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[.18em] text-amber-700">Page unavailable</p>
          <h1 className="mt-2 font-clash text-3xl font-semibold">This page isn’t available.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">You can return to Nexora and continue exploring the community.</p>
          <Link href="/" className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-[#111827] px-4 text-sm font-medium text-white">Return to Nexora <ArrowLeft size={14} /></Link>
        </section>
      </div>
    )
  }

  return (
    <div className="text-[#111827]">
      <div>
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.18em] text-[#0784a5]"><span className="h-1.5 w-1.5 rounded-full bg-[#08a6c8]" /> Nexora Connect · Management</p>
            <h1 className="mt-2 font-clash text-4xl font-semibold tracking-tight sm:text-5xl">Connect management</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">New profiles are listed for admin confirmation only; no approval is required. Members control whether their profile is public. Manage reports, account access, and student number requests here.</p>
          </div>
          <button type="button" onClick={onNavigateToRoster} className="inline-flex h-10 items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 md:self-auto"><UsersRound size={14} /> Manage student list</button>
        </header>

        <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Connect management sections">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => changeTab(id)}
              className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-xs font-medium transition ${tab === id ? 'border-[#111827] bg-[#111827] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'}`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {(error || success) && (
          <div role={error ? 'alert' : 'status'} className={`mt-5 flex items-start gap-2 rounded-xl border p-3 text-xs ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {error ? <CircleAlert size={15} className="mt-0.5 shrink-0" /> : <Check size={15} className="mt-0.5 shrink-0" />}
            <span>{error || success}</span>
          </div>
        )}

        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h2 className="font-semibold">{tabs.find((item) => item.id === tab)?.label}</h2>
              <p className="mt-1 text-xs text-slate-500">
                {count} {count === 1 ? 'item' : 'items'}
                {tab === 'profiles' ? ' · Confirmation only; does not affect profile visibility.' : ' · Your decisions are saved in the admin history.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {tab === 'accounts' && (
                <input
                  aria-label="Search registered members"
                  value={accountQuery}
                  onChange={(event) => {
                    setAccountQuery(event.target.value)
                    setPage(1)
                  }}
                  placeholder="Search name, email or USN"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-cyan-500 sm:w-56"
                />
              )}
              {tab !== 'profiles' && <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
                Show
                <select
                  value={filters[tab]}
                  onChange={(event) => {
                    setFilters((current) => ({ ...current, [tab]: event.target.value }))
                    setPage(1)
                  }}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none focus:border-cyan-500"
                >
                  {statusOptions[tab].map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                </select>
              </label>}
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {loading && <div className="px-5 py-14 text-center text-xs text-slate-400">Loading…</div>}
            {!loading && tab === 'profiles' && profiles.length === 0 && <EmptyQueue text="No new profiles to confirm." />}
            {!loading && tab === 'reports' && reports.length === 0 && <EmptyQueue text="No reports match this status." />}
            {!loading && tab === 'disputes' && disputes.length === 0 && <EmptyQueue text="No student number requests to show here." />}
            {!loading && tab === 'accounts' && accounts.length === 0 && <EmptyQueue text="No registered members match this filter." />}

            {!loading && tab === 'accounts' && accounts.map((account) => (
              <article key={account.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{account.profile?.fullName ?? account.email}</h3>
                    <StatusBadge status={account.disabled ? 'DISABLED' : account.emailConfirmedAt ? 'ACTIVE' : 'UNCONFIRMED'} />
                  </div>
                  <p className="mt-1 break-all text-xs text-slate-500">{account.email}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {account.usn ? `USN ${account.usn} · ` : ''}
                    {account.emailConfirmedAt
                      ? `Email confirmed ${dateLabel(account.emailConfirmedAt)}`
                      : 'Email confirmation pending'}
                    {` · Registered ${dateLabel(account.createdAt)}`}
                  </p>
                  {account.profile && (
                    <Link
                      href={`/connect/members/${encodeURIComponent(account.profile.slug)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-cyan-800 hover:text-cyan-950"
                    >
                      View member profile <ChevronRight size={13} />
                    </Link>
                  )}
                </div>
                {canManageAccounts && (
                  <button
                    type="button"
                    onClick={() => void setAccountStatus(account, account.disabled ? 'ACTIVE' : 'DISABLED')}
                    disabled={busyId === account.id}
                    className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-medium transition disabled:opacity-50 ${
                      account.disabled
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        : 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100'
                    }`}
                  >
                    {account.disabled ? <CircleCheck size={14} /> : <ShieldAlert size={14} />}
                    {busyId === account.id ? 'Saving…' : account.disabled ? 'Restore access' : 'Disable access'}
                  </button>
                )}
              </article>
            ))}

            {!loading && tab === 'profiles' && profiles.map((profile) => (
              <article key={profile.authUserId} className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{profile.fullName}</h3><StatusBadge status="PENDING" /></div>
                    <p className="mt-1 text-xs text-slate-500">{profile.usn} · {profile.memberType === 'ALUMNUS' ? 'Alumnus' : 'Student'} · Class of {profile.graduationYear}</p>
                    <p className="mt-2 text-xs text-slate-600">{profile.bio || 'No biography provided.'}</p>
                    <p className="mt-2 text-[10px] text-slate-400">Submitted {dateLabel(profile.createdAt)} · Name on department records: {profile.rosterName ?? 'No active student record found'}</p>
                    {!profile.rosterNameMatches && <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800"><CircleAlert size={12} /> Please check the official roster details for this profile.</p>}
                  </div>
                  {profile.visibility === 'PUBLIC' && (
                    <Link href={`/connect/members/${encodeURIComponent(profile.slug)}`} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-cyan-800 hover:text-cyan-950">View profile <ChevronRight size={14} /></Link>
                  )}
                </div>
              </article>
            ))}

            {!loading && tab === 'reports' && reports.map((report) => (
              <article key={report.id} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{report.reason}</h3><StatusBadge status={report.status} /></div>
                <p className="mt-1 text-xs text-slate-500">{report.target === 'PROFILE' ? 'Member profile' : 'Knowledge page'} · {report.profile.fullName} · {report.profile.usn} · submitted {dateLabel(report.createdAt)}</p>
                {report.details && <p className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-700">{report.details}</p>}
                {report.resolutionNote && <p className="mt-2 text-[11px] text-slate-500">Previous resolution: {report.resolutionNote}</p>}
                <div className="mt-3"><Link href={`/connect/members/${encodeURIComponent(report.profile.slug)}`} target="_blank" rel="noreferrer" className="text-xs font-medium text-cyan-800 hover:text-cyan-950">Open reported profile <ChevronRight size={13} className="inline" /></Link></div>
                <ReviewForm busy={busyId === report.id} onSubmit={(status, note) => review('reports', report.id, status, note)} />
              </article>
            ))}

            {!loading && tab === 'disputes' && disputes.map((dispute) => (
              <article key={dispute.id} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">USN {dispute.usn}</h3><StatusBadge status={dispute.status} /></div>
                <p className="mt-1 text-xs text-slate-500">Requested by {dispute.claim.profile.fullName} · submitted {dateLabel(dispute.createdAt)}</p>
                <p className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-700">{dispute.details}</p>
                {dispute.resolutionNote && <p className="mt-2 text-[11px] text-slate-500">Previous resolution: {dispute.resolutionNote}</p>}
                <div className="mt-3"><Link href={`/connect/members/${encodeURIComponent(dispute.claim.profile.slug)}`} target="_blank" rel="noreferrer" className="text-xs font-medium text-cyan-800 hover:text-cyan-950">Open linked profile <ChevronRight size={13} className="inline" /></Link></div>
                <ReviewForm busy={busyId === dispute.id} onSubmit={(status, note) => review('disputes', dispute.id, status, note)} />
              </article>
            ))}
          </div>

          <footer className="flex items-center justify-between border-t border-slate-100 px-4 py-3 sm:px-5">
            <span className="text-[11px] text-slate-500">Page {pagination?.page ?? page} of {totalPages}</span>
            <div className="flex gap-2">
              <button type="button" aria-label="Previous page" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"><ChevronLeft size={15} /></button>
              <button type="button" aria-label="Next page" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"><ChevronRight size={15} /></button>
            </div>
          </footer>
        </section>
        <p className="mt-4 flex items-center gap-2 text-[10px] leading-5 text-slate-400"><ClipboardCheck size={13} /> Add a note when asking for changes or closing a request so the member understands the decision.</p>
      </div>
    </div>
  )
}

function EmptyQueue({ text }: { text: string }) {
  return <div className="px-5 py-14 text-center"><span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-400"><ClipboardCheck size={18} /></span><p className="mt-3 text-xs text-slate-500">{text}</p></div>
}
