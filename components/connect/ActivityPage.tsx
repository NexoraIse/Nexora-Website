'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, Flag, MessageSquareWarning, Send, ShieldAlert } from 'lucide-react'
import { ConnectShell } from './ConnectShell'
import { Button, Feedback, Field, PageHeading, Panel, StatusPill, TextField } from './ConnectUI'

type Report = {
  id: string
  target: 'PROFILE' | 'KNOWLEDGE_PAGE'
  reason: string
  details: string | null
  status: string
  resolutionNote: string | null
  createdAt: string
  profile: { slug: string; fullName: string }
}

type Dispute = {
  id: string
  usn: string
  details: string
  status: string
  resolutionNote: string | null
  createdAt: string
}

function getProfileSlug(value: string) {
  const trimmed = value.trim()
  if (!trimmed.startsWith('/') && !/^https?:\/\//i.test(trimmed)) return trimmed

  try {
    const url = new URL(trimmed, window.location.origin)
    const match = url.pathname.match(/\/connect\/members\/([^/]+)\/?$/)
    return match ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}

export default function ActivityPage() {
  const searchParams = useSearchParams()
  const [reports, setReports] = useState<Report[]>([])
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [activeTab, setActiveTab] = useState<'reports' | 'disputes'>('reports')
  const [slug, setSlug] = useState(searchParams.get('slug') ?? '')
  const [target, setTarget] = useState<'PROFILE' | 'KNOWLEDGE_PAGE'>(
    searchParams.get('target') === 'KNOWLEDGE_PAGE' ? 'KNOWLEDGE_PAGE' : 'PROFILE'
  )
  const [reason, setReason] = useState('Incorrect or misleading information')
  const [usn, setUsn] = useState('')
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; kind: 'error' | 'success' | 'info' } | null>(null)

  async function fetchActivity() {
    const [sessionResponse, reportResponse, disputeResponse] = await Promise.all([
      fetch('/api/connect/auth/session', { cache: 'no-store' }),
      fetch('/api/connect/reports', { cache: 'no-store' }),
      fetch('/api/connect/disputes', { cache: 'no-store' }),
    ])
    const session = await sessionResponse.json()
    if (!session.authenticated || !session.emailVerified) return { authenticated: false as const }
    const [reportData, disputeData] = await Promise.all([reportResponse.json(), disputeResponse.json()])
    if (!reportResponse.ok) throw new Error(reportData.error || 'Unable to load your reports.')
    if (!disputeResponse.ok) throw new Error(disputeData.error || 'Unable to load your USN disputes.')
    return {
      authenticated: true as const,
      reports: reportData.reports as Report[],
      disputes: disputeData.disputes as Dispute[],
    }
  }

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const data = await fetchActivity()
        if (!active) return
        setAuthenticated(data.authenticated)
        if (data.authenticated) {
          setReports(data.reports)
          setDisputes(data.disputes)
        }
      } catch (error) {
        if (active) setFeedback({ message: error instanceof Error ? error.message : 'Unable to load your activity.', kind: 'error' })
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  async function loadActivity() {
    const data = await fetchActivity()
    setAuthenticated(data.authenticated)
    if (data.authenticated) {
      setReports(data.reports)
      setDisputes(data.disputes)
    }
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const profileSlug = getProfileSlug(slug)
    if (!profileSlug) {
      setFeedback({ message: 'That profile link doesn’t look right. Open the member’s profile and copy its address.', kind: 'error' })
      return
    }
    setBusy(true)
    setFeedback(null)
    try {
      const response = await fetch('/api/connect/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ slug: profileSlug, target, reason, details: details || null }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to send your report.')
      setFeedback({ message: 'Thanks for letting us know. The Connect team will review your report.', kind: 'success' })
      setSlug('')
      setDetails('')
      await loadActivity()
    } catch (error) {
      setFeedback({ message: error instanceof Error ? error.message : 'Unable to send your report.', kind: 'error' })
    } finally {
      setBusy(false)
    }
  }

  async function submitDispute(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setFeedback(null)
    try {
      const response = await fetch('/api/connect/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ usn, details }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to send your student number request.')
      setFeedback({ message: 'We’ve received your request. The Connect team will look into it.', kind: 'success' })
      setUsn('')
      setDetails('')
      await loadActivity()
    } catch (error) {
      setFeedback({ message: error instanceof Error ? error.message : 'Unable to send your student number request.', kind: 'error' })
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <ConnectShell><div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8"><div className="connect-skeleton h-64" /></div></ConnectShell>

  if (!authenticated) {
    return (
      <ConnectShell>
        <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8">
          <Panel className="mx-auto max-w-xl p-8 text-center">
            <span className="connect-empty-icon"><ShieldAlert size={22} /></span>
            <p className="connect-eyebrow mt-5">Community care</p>
            <h1 className="mt-2 font-clash text-3xl text-white">Sign in to continue.</h1>
            <p className="mt-3 text-sm leading-6 text-[#aab6c2]">Continue with Google to contact the Connect team.</p>
            <Link href="/connect/sign-in" className="connect-button connect-button-primary mt-6">Continue with Google</Link>
          </Panel>
        </div>
      </ConnectShell>
    )
  }

  return (
    <ConnectShell>
      <div className="mx-auto max-w-[1440px] px-5 pb-20 pt-12 sm:px-8 sm:pt-16 lg:px-12 lg:pt-20">
        <Link href="/connect/dashboard" className="connect-back-link"><ArrowLeft size={14} /> Back to your space</Link>
        <PageHeading
          eyebrow="Care for the community"
          title={<>A better network<br className="hidden sm:block" /> takes <span className="connect-title-accent">all of us.</span></>}
          description="Let us know if something needs attention, or if there’s a problem with your USN. Only you and the Connect team can see what you send."
        />

        {feedback && <div className="mb-5"><Feedback message={feedback.message} kind={feedback.kind} /></div>}

        <div className="grid items-start gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Panel className="overflow-hidden">
            <div className="flex border-b border-white/[0.07] p-2">
              <button type="button" onClick={() => { setActiveTab('reports'); setDetails('') }} className={`connect-tab ${activeTab === 'reports' ? 'is-active' : ''}`}><Flag size={14} /> Report a profile</button>
              <button type="button" onClick={() => { setActiveTab('disputes'); setDetails('') }} className={`connect-tab ${activeTab === 'disputes' ? 'is-active' : ''}`}><MessageSquareWarning size={14} /> Student number help</button>
            </div>
            <div className="p-5 sm:p-7">
              {activeTab === 'reports' ? (
                <form onSubmit={submitReport} className="space-y-4">
                  <div>
                    <p className="connect-eyebrow">Report content</p>
                    <h2 className="mt-2 font-clash text-2xl text-white">Tell us what’s wrong.</h2>
                    <p className="mt-2 text-xs leading-5 text-[#9baab6]">Choose a profile you can see and tell us what we should take a look at.</p>
                  </div>
                  <Field label="Link to the member’s profile" value={slug} onChange={(event) => setSlug(event.target.value)} required placeholder="Paste the member’s profile link" hint="Open their profile and copy the address from your browser." />
                  <label className="block">
                    <span className="mb-2 block text-[12px] font-medium text-[#d8e2e9]">What are you reporting?</span>
                    <select className="connect-input" value={target} onChange={(event) => setTarget(event.target.value as typeof target)}>
                      <option value="PROFILE">Member profile</option>
                      <option value="KNOWLEDGE_PAGE">Published writing</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[12px] font-medium text-[#d8e2e9]">Reason</span>
                    <select className="connect-input" value={reason} onChange={(event) => setReason(event.target.value)}>
                      <option>Incorrect or misleading information</option>
                      <option>Inappropriate or harmful content</option>
                      <option>Impersonation or identity concern</option>
                      <option>Spam or promotional misuse</option>
                      <option>Other concern</option>
                    </select>
                  </label>
                  <TextField label="Anything else we should know? (optional)" value={details} onChange={(event) => setDetails(event.target.value)} maxLength={2000} placeholder="Share any details that could help us understand the issue." />
                  <Button type="submit" loading={busy} className="w-full"><Send size={15} /> Submit report</Button>
                </form>
              ) : (
                <form onSubmit={submitDispute} className="space-y-4">
                  <div>
                    <p className="connect-eyebrow">Help with your student number</p>
                    <h2 className="mt-2 font-clash text-2xl text-white">Something doesn’t look right?</h2>
                    <p className="mt-2 text-xs leading-5 text-[#9baab6]">If you can’t use your USN because it’s linked to another account, tell us and we’ll help.</p>
                  </div>
                  <Field label="Your official USN" value={usn} onChange={(event) => setUsn(event.target.value.toUpperCase())} required placeholder="e.g. 4AL22IS001" />
                  <TextField label="Tell us what happened" value={details} onChange={(event) => setDetails(event.target.value)} required minLength={10} maxLength={4000} placeholder="Share any details that will help us sort this out." />
                  <p className="text-[10px] leading-5 text-[#82919e]">Only you and the Connect team can see your USN and this request.</p>
                  <Button type="submit" loading={busy} className="w-full"><Send size={15} /> Send request</Button>
                </form>
              )}
            </div>
          </Panel>

          <section>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div><p className="connect-eyebrow">Your history</p><h2 className="mt-2 font-clash text-2xl text-white">Submissions</h2></div>
              <span className="text-[11px] text-[#82919e]">{reports.length + disputes.length} {reports.length + disputes.length === 1 ? 'request' : 'requests'}</span>
            </div>
            <div className="space-y-3">
              {reports.map((report) => (
                <Panel key={report.id} className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[#82919e]">Profile report · {new Date(report.createdAt).toLocaleDateString()}</p>
                      <Link href={`/connect/members/${encodeURIComponent(report.profile.slug)}`} className="mt-2 block truncate font-medium text-white hover:text-[#83d9f0]">{report.profile.fullName}</Link>
                      <p className="mt-1 truncate text-xs text-[#aab6c2]">{report.reason}</p>
                    </div>
                    <StatusPill status={report.status} />
                  </div>
                  {report.resolutionNote && <p className="mt-3 border-t border-white/[0.07] pt-3 text-xs leading-5 text-[#9baab6]">{report.resolutionNote}</p>}
                </Panel>
              ))}
              {disputes.map((dispute) => (
                <Panel key={dispute.id} className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[#82919e]">Student number help · {new Date(dispute.createdAt).toLocaleDateString()}</p>
                      <p className="mt-2 truncate font-medium text-white">{dispute.usn}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-[#aab6c2]">{dispute.details}</p>
                    </div>
                    <StatusPill status={dispute.status} />
                  </div>
                  {dispute.resolutionNote && <p className="mt-3 border-t border-white/[0.07] pt-3 text-xs leading-5 text-[#9baab6]">{dispute.resolutionNote}</p>}
                </Panel>
              ))}
              {reports.length === 0 && disputes.length === 0 && (
                <Panel className="p-6 text-center">
                  <p className="font-medium text-white">Nothing to follow up on.</p>
                  <p className="mt-2 text-xs text-[#82919e]">Your messages to the Connect team will appear here.</p>
                </Panel>
              )}
            </div>
          </section>
        </div>
      </div>
    </ConnectShell>
  )
}
