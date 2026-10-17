'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import { ArrowUpRight, X } from 'lucide-react'
import { ConnectShell } from './ConnectShell'
import { Button, Panel } from './ConnectUI'

type ProfileCard = {
  slug: string
  fullName: string
  graduationYear: number
  memberType: 'STUDENT' | 'ALUMNUS'
  bio: string | null
  avatarUrl: string | null
  skills: string[]
  currentRole: string | null
  company: string | null
  openToCollaborate: boolean
  mentoringAvailable: boolean
  searchMatches?: Array<{ section: string; excerpt: string }>
}

type DirectoryResponse = {
  profiles: ProfileCard[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function ProfileAvatar({ name, src }: { name: string; src: string | null }) {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <div className="connect-avatar connect-directory-avatar">
      <span aria-hidden="true">{initials(name)}</span>
      {src && !imageFailed && (
        <Image
          src={src}
          alt=""
          width={64}
          height={64}
          unoptimized
          className="connect-directory-avatar-image"
          onError={() => setImageFailed(true)}
        />
      )}
    </div>
  )
}

export default function DirectoryPage() {
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const authDialogRef = useRef<HTMLDialogElement>(null)
  const [query, setQuery] = useState('')
  const [memberType, setMemberType] = useState('')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<DirectoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadProfiles = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ page: String(page), limit: '12' })
    if (query.trim()) params.set('q', query.trim())
    if (memberType) params.set('memberType', memberType)
    try {
      const response = await fetch(`/api/connect/members?${params}`, {
        cache: 'no-store',
        signal,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load the member directory.')
      setResult(data)
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return
      setError(cause instanceof Error ? cause.message : 'Unable to load the member directory.')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [memberType, page, query])

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(
      () => void loadProfiles(controller.signal),
      query.trim() ? 220 : 0
    )
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadProfiles, query])

  useEffect(() => {
    const dialog = authDialogRef.current
    if (!dialog) return
    if (authDialogOpen && !dialog.open) dialog.showModal()
    if (!authDialogOpen && dialog.open) dialog.close()
  }, [authDialogOpen])

  const profiles = result?.profiles ?? []

  function closeAuthDialog(event?: MouseEvent<HTMLDialogElement>) {
    if (event && event.target !== event.currentTarget) return
    setAuthDialogOpen(false)
  }

  return (
    <ConnectShell>
      <dialog
        ref={authDialogRef}
        className="connect-auth-dialog"
        aria-labelledby="connect-auth-dialog-title"
        aria-describedby="connect-auth-dialog-description"
        onClose={() => setAuthDialogOpen(false)}
        onCancel={() => setAuthDialogOpen(false)}
        onClick={closeAuthDialog}
      >
        <div className="connect-auth-dialog-card">
          <button
            type="button"
            className="connect-auth-dialog-close"
            onClick={() => setAuthDialogOpen(false)}
            aria-label="Close sign-in dialog"
          >
            <X size={18} aria-hidden="true" />
          </button>
          <p className="connect-eyebrow">Nexora · Connect</p>
          <h2 id="connect-auth-dialog-title">Welcome to your community.</h2>
          <p id="connect-auth-dialog-description">
            Continue with Google. New members can set up a profile; returning members will go straight to their Connect space.
          </p>
          <form action="/api/connect/auth/google" method="get">
            <button
              type="submit"
              className="connect-google-button"
            >
              <svg aria-hidden="true" className="h-[18px] w-[18px] shrink-0" viewBox="0 0 48 48">
                <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.9 6-15Z" />
                <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.1c-1.8 1.2-4.1 2-6.8 2-5.3 0-9.8-3.6-11.4-8.4H5.7v5.3A20 20 0 0 0 24 44Z" />
                <path fill="#FBBC05" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.3H5.7a20 20 0 0 0 0 17.8l6.9-5.3Z" />
                <path fill="#EA4335" d="M24 11.9c3 0 5.7 1 7.8 3.1l5.8-5.8A19.4 19.4 0 0 0 24 4 20 20 0 0 0 5.7 15.1l6.9 5.3c1.6-4.9 6.1-8.5 11.4-8.5Z" />
              </svg>
              <span>Continue with Google</span>
            </button>
          </form>
          <p className="connect-auth-dialog-note">
            New members verify their ISE details during profile setup. Your Google account keeps sign-in simple and secure.
          </p>
        </div>
      </dialog>

      <div className="mx-auto max-w-7xl px-5 pb-20 pt-28 sm:px-8 lg:px-12">
        <section className="mb-10 max-w-4xl sm:mb-12">
          <p className="connect-directory-kicker">Department of ISE · Nexora Connect</p>
          <h1 className="mt-4 max-w-4xl font-clash text-[clamp(2.8rem,6.5vw,5.5rem)] font-bold leading-[0.95] tracking-tight text-[var(--theme-bg-hero,#dce6ef)]">
            People and ideas from <span className="text-[var(--theme-primary,#00f0ff)]">ISE.</span>
          </h1>
          <p className="mt-5 max-w-2xl font-cabinet text-base font-medium leading-relaxed text-white/75 sm:text-lg">
            Find peers and graduates by role, skill, or company. Reach out for guidance, collaboration, referral advice, interview insights, and more.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => setAuthDialogOpen(true)}>Join or sign in</Button>
          </div>
        </section>

        <Panel className="connect-directory-search mb-8 p-3 sm:p-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
            <label className="relative block">
              <input
                value={query}
                onChange={(event) => { setQuery(event.target.value); setPage(1) }}
                placeholder="Search profiles, skills, experience, or knowledge pages"
                aria-label="Search all public profile content"
                className="connect-input h-12"
              />
            </label>
            <label className="relative block">
              <select
                value={memberType}
                onChange={(event) => { setMemberType(event.target.value); setPage(1) }}
                aria-label="Filter by community role"
                className="connect-input h-12"
              >
                <option value="">Everyone</option>
                <option value="STUDENT">Students</option>
                <option value="ALUMNUS">Alumni</option>
              </select>
            </label>
            <div className="flex items-center justify-center px-4 text-xs text-[#aab6c2] md:min-w-[150px]">
              {loading ? 'Searching…' : `${result?.pagination.total ?? 0} ${query.trim() ? 'matches' : 'members'}`}
            </div>
          </div>
          <p className="px-1 pt-3 text-[11px] leading-5 text-[#82919e]">
            Searches public profile details, skills, experience, achievements, and published knowledge pages.
          </p>
        </Panel>

        {error && <div className="connect-feedback connect-feedback-error mb-6" role="alert">{error}</div>}

        {!loading && !error && profiles.length === 0 && (
          <Panel className="overflow-hidden p-8 sm:p-12">
            <div className="mx-auto max-w-lg text-center">
              <p className="connect-eyebrow">{query.trim() ? 'Search results' : 'Nothing to show just yet'}</p>
              <h2 className="mt-3 font-clash text-3xl font-medium tracking-tight text-white">
                {query.trim() ? 'No profiles match that search.' : 'The community is just getting started.'}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#aab6c2]">
                {query.trim()
                  ? 'Try another name, skill, or phrase from a published knowledge page.'
                  : 'No one has shared a profile yet. If you&apos;re part of ISE at AJIET, you could be the first.'}
              </p>
              {query.trim()
                ? <button type="button" className="connect-button connect-button-secondary mt-6" onClick={() => setQuery('')}>Clear search</button>
                : <>
                    <Button className="mt-6" onClick={() => setAuthDialogOpen(true)}>Join or sign in</Button>
                    <p className="mt-5 text-[11px] leading-5 text-[#82919e]">New members verify their ISE details during profile setup; returning members access their existing profile.</p>
                  </>}
            </div>
          </Panel>
        )}

        {(loading || profiles.length > 0) && (
          <div className="connect-profile-grid">
            {loading && profiles.length === 0
              ? Array.from({ length: 6 }, (_, index) => <div key={index} className="connect-skeleton h-[390px]" />)
              : profiles.map((profile, index) => (
                <Link
                  key={profile.slug}
                  href={`/connect/members/${encodeURIComponent(profile.slug)}`}
                  className="connect-member-card connect-profile-directory-card group"
                  style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
                >
                  <div className="connect-profile-directory-portrait">
                    <ProfileAvatar name={profile.fullName} src={profile.avatarUrl} />
                    <span className="connect-profile-directory-type">{profile.memberType === 'ALUMNUS' ? 'Alumni' : 'Student'} · {profile.graduationYear}</span>
                  </div>
                  <div className="connect-profile-directory-content">
                    <h2>{profile.fullName}</h2>
                    <p className="connect-profile-directory-role">
                      {profile.currentRole || (profile.memberType === 'ALUMNUS' ? 'ISE graduate' : 'ISE student')}
                      {profile.company && <> <span aria-hidden="true">at</span> {profile.company}</>}
                    </p>
                    <p className="connect-profile-directory-bio line-clamp-3">{profile.bio || 'A member of the ISE community at AJIET.'}</p>
                    {query.trim() && profile.searchMatches && profile.searchMatches.length > 0 && (
                      <div className="connect-search-matches">
                        {profile.searchMatches.map((match) => (
                          <p key={match.section} className="connect-search-match">
                            <span>{match.section}</span>
                            <span>{match.excerpt}</span>
                          </p>
                        ))}
                      </div>
                    )}
                    {profile.skills.length > 0 && (
                      <div className="connect-profile-directory-skills">
                        {profile.skills.slice(0, 3).map((skill) => <span key={skill}>{skill}</span>)}
                        {profile.skills.length > 3 && <span>+{profile.skills.length - 3}</span>}
                      </div>
                    )}
                    {(profile.openToCollaborate || profile.mentoringAvailable) && (
                      <div className="connect-profile-directory-availability">
                        {profile.openToCollaborate && <span>Open to collaborate</span>}
                        {profile.mentoringAvailable && <span>Available to mentor</span>}
                      </div>
                    )}
                    <span className="connect-profile-directory-link">View profile <ArrowUpRight size={14} /></span>
                  </div>
                </Link>
              ))}
          </div>
        )}

        {(result?.pagination.totalPages ?? 0) > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <p className="text-xs text-[#82919e]">Page {page} of {result?.pagination.totalPages}</p>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Previous</Button>
              <Button variant="secondary" disabled={page >= (result?.pagination.totalPages ?? 1) || loading} onClick={() => setPage((current) => current + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </ConnectShell>
  )
}
