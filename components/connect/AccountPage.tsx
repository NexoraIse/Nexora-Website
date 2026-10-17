'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, ChevronRight, LockKeyhole, Plus, Save, Upload, UserRound, X } from 'lucide-react'
import { ConnectShell } from './ConnectShell'
import { KnowledgeEditor } from './KnowledgeEditor'
import { Button, Feedback, Field, PageHeading, Panel, StatusPill, TextField } from './ConnectUI'

type SocialLink = { label: string; url: string }
type Profile = {
  authUserId: string
  slug: string
  fullName: string
  usn: string
  graduationYear: number
  memberType: 'STUDENT' | 'ALUMNUS'
  bio: string | null
  avatarUrl: string | null
  skills: string[]
  interests: string[]
  skillsInDevelopment: string[]
  location: string | null
  phone: string | null
  phonePublic: boolean
  contactEmail: string | null
  contactEmailPublic: boolean
  visibility: 'PUBLIC' | 'PRIVATE'
  approvalStatus: string
  reviewNote: string | null
  currentRole: string | null
  company: string | null
  openToCollaborate: boolean
  mentoringAvailable: boolean
  referralAvailable: boolean
  socialLinks: SocialLink[]
}

type Draft = {
  usn: string
  graduationYear: string
  memberType: 'STUDENT' | 'ALUMNUS'
  bio: string
  avatarUrl: string
  location: string
  phone: string
  phonePublic: boolean
  contactEmail: string
  contactEmailPublic: boolean
  currentRole: string
  company: string
  skills: string
  interests: string
  skillsInDevelopment: string
  openToCollaborate: boolean
  mentoringAvailable: boolean
  referralAvailable: boolean
  visibility: 'PUBLIC' | 'PRIVATE'
}

const emptyDraft: Draft = {
  usn: '',
  graduationYear: String(new Date().getFullYear()),
  memberType: 'STUDENT',
  bio: '',
  avatarUrl: '',
  location: '',
  phone: '',
  phonePublic: false,
  contactEmail: '',
  contactEmailPublic: false,
  currentRole: '',
  company: '',
  skills: '',
  interests: '',
  skillsInDevelopment: '',
  openToCollaborate: false,
  mentoringAvailable: false,
  referralAvailable: false,
  visibility: 'PRIVATE',
}

function fromProfile(profile: Profile): Draft {
  return {
    usn: profile.usn,
    graduationYear: String(profile.graduationYear),
    memberType: profile.memberType,
    bio: profile.bio ?? '',
    avatarUrl: profile.avatarUrl ?? '',
    location: profile.location ?? '',
    phone: profile.phone ?? '',
    phonePublic: profile.phonePublic,
    contactEmail: profile.contactEmail ?? '',
    contactEmailPublic: profile.contactEmailPublic,
    currentRole: profile.currentRole ?? '',
    company: profile.company ?? '',
    skills: profile.skills.join(', '),
    interests: profile.interests.join(', '),
    skillsInDevelopment: profile.skillsInDevelopment.join(', '),
    openToCollaborate: profile.openToCollaborate,
    mentoringAvailable: profile.mentoringAvailable,
    referralAvailable: profile.referralAvailable,
    visibility: profile.visibility,
  }
}

function parseList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

export default function AccountPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [usnVerified, setUsnVerified] = useState(false)
  const [officialName, setOfficialName] = useState('')
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
  const [feedback, setFeedback] = useState<{ message: string; kind: 'error' | 'success' | 'info' } | null>(null)
  const [busy, setBusy] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarFeedback, setAvatarFeedback] = useState<string | null>(null)
  const [avatarPreviewFailed, setAvatarPreviewFailed] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const sessionResponse = await fetch('/api/connect/auth/session', { cache: 'no-store' })
        const session = await sessionResponse.json()
        if (!active) return
        setAuthenticated(Boolean(session.authenticated))
        setEmailVerified(Boolean(session.emailVerified))
        if (!session.authenticated) return
        const response = await fetch('/api/connect/me', { cache: 'no-store' })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Unable to load your profile.')
        if (!active) return
        if (data.profile) {
          const loaded = data.profile as Profile
          setProfile(loaded)
          setDraft(fromProfile(loaded))
          setSocialLinks(loaded.socialLinks)
        } else {
          setDraft((current) => ({
            ...current,
            usn: session.user?.connectUsn ?? '',
            contactEmail: session.user?.email ?? '',
          }))
        }
      } catch (error) {
        if (active) setFeedback({ message: error instanceof Error ? error.message : 'Unable to load your profile.', kind: 'error' })
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  async function verifyUsn() {
    setBusy(true)
    setFeedback(null)
    setUsnVerified(false)
    setOfficialName('')
    try {
      const response = await fetch(`/api/connect/verify-usn?usn=${encodeURIComponent(draft.usn)}`, {
        cache: 'no-store',
      })
      const data = await response.json()
      if (!response.ok || !data.valid) {
        throw new Error(data.error || 'We could not find this student number in the department list.')
      }
      setOfficialName(data.fullName)
      setUsnVerified(true)
      setFeedback({
        message: 'Student number confirmed. Your department-record name is shown below.',
        kind: 'success',
      })
    } catch (error) {
      setFeedback({
        message: error instanceof Error ? error.message : 'Unable to verify your student number right now.',
        kind: 'error',
      })
    } finally {
      setBusy(false)
    }
  }

  async function uploadAvatar(file: File | undefined) {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarFeedback('Choose a JPG, PNG, or WebP image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarFeedback('Choose an image smaller than 5 MB.')
      return
    }

    setAvatarUploading(true)
    setAvatarFeedback(null)
    try {
      const formData = new FormData()
      formData.set('file', file)
      const response = await fetch('/api/connect/avatar-upload', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'We could not upload that photo. Please try again.')
      setAvatarPreviewFailed(false)
      update('avatarUrl', data.url)
      setAvatarFeedback('Photo uploaded. Save your profile to apply it.')
    } catch (error) {
      setAvatarFeedback(error instanceof Error ? error.message : 'We could not upload that photo. Please try again.')
    } finally {
      setAvatarUploading(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile && (!usnVerified || !officialName)) {
      setFeedback({ message: 'Verify your student number before creating your profile.', kind: 'error' })
      return
    }
    setBusy(true)
    setFeedback(null)
    const body: Record<string, unknown> = {
      ...draft,
      ...(!profile ? { fullName: officialName } : {}),
      graduationYear: Number(draft.graduationYear),
      skills: parseList(draft.skills),
      interests: parseList(draft.interests),
      skillsInDevelopment: parseList(draft.skillsInDevelopment),
      avatarUrl: draft.avatarUrl || null,
      phone: draft.phone || null,
      contactEmail: draft.contactEmail || null,
      socialLinks: socialLinks.filter((item) => item.label.trim() && item.url.trim()),
    }
    if (profile) {
      if (Number(draft.graduationYear) === profile.graduationYear) delete body.graduationYear
      if (draft.memberType === profile.memberType) delete body.memberType
    }
    try {
      let response = await fetch('/api/connect/me', {
        method: profile ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      })
      let data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to save your profile.')
      if (!profile) {
        setProfile(data.profile as Profile)
        delete body.fullName
        response = await fetch('/api/connect/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(body),
        })
        data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Your profile was created, but some portfolio details could not be saved. Review and save again.')
        }
      }
      const saved = data.profile as Profile
      setProfile(saved)
      setDraft(fromProfile(saved))
      setSocialLinks(saved.socialLinks)
      window.sessionStorage.removeItem('connect-usn')
      setFeedback({
        message: profile
          ? saved.approvalStatus === 'PENDING' ? 'Saved. Changes to your identity need another review.' : 'Your profile changes are saved.'
          : 'Your profile is waiting for review. You can keep improving it in the meantime.',
        kind: 'success',
      })
    } catch (error) {
      setFeedback({ message: error instanceof Error ? error.message : 'Unable to save your profile.', kind: 'error' })
    } finally {
      setBusy(false)
    }
  }

  async function signOut() {
    setBusy(true)
    try {
      await fetch('/api/connect/auth/sign-out', { method: 'POST', credentials: 'same-origin' })
      router.replace('/connect')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <ConnectShell><div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8"><div className="connect-skeleton h-64" /></div></ConnectShell>
  }

  if (!authenticated) {
    return (
      <ConnectShell>
        <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8">
          <Panel className="mx-auto max-w-xl p-8 text-center">
            <span className="connect-empty-icon"><LockKeyhole size={22} /></span>
            <p className="connect-eyebrow mt-5">Members only</p>
            <h1 className="mt-2 font-clash text-3xl text-white">Your space is waiting.</h1>
            <p className="mt-3 text-sm leading-6 text-[#aab6c2]">Sign in to set up your profile, share your work and manage your community activity.</p>
            <Link href="/connect/sign-in" className="connect-button connect-button-primary mt-6">Sign in <ArrowRight size={16} /></Link>
          </Panel>
        </div>
      </ConnectShell>
    )
  }

  if (!emailVerified) {
    return (
      <ConnectShell>
        <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8">
          <Panel className="mx-auto max-w-xl p-8 text-center">
            <span className="connect-empty-icon"><LockKeyhole size={22} /></span>
            <p className="connect-eyebrow mt-5">Almost there</p>
            <h1 className="mt-2 font-clash text-3xl text-white">Use a verified Google account.</h1>
            <p className="mt-3 text-sm leading-6 text-[#aab6c2]">This Google account does not have a verified email address. Sign out and continue with a verified Google account to set up your Connect profile.</p>
            <Button variant="secondary" className="mt-6" onClick={signOut}>Sign out</Button>
          </Panel>
        </div>
      </ConnectShell>
    )
  }

  return (
    <ConnectShell>
      <div className="connect-account-page mx-auto max-w-[1240px] px-5 pb-20 pt-12 sm:px-8 sm:pt-16 lg:px-12 lg:pt-20">
        <PageHeading
          eyebrow={profile ? 'CONNECT / ACCOUNT' : 'CONNECT / SETUP'}
          title={profile
            ? <>Your profile<span className="text-[#7bb7aa]">.</span></>
            : usnVerified
              ? <>Tell us about <span className="text-[#7bb7aa]">you.</span></>
              : <>Verify your <span className="text-[#7bb7aa]">details.</span></>}
          description={profile
            ? 'Keep your details current so classmates and graduates can find and connect with you.'
            : usnVerified
              ? 'Your official name is confirmed. Add the details you’d like to share with the community.'
              : 'Enter your official student number. We’ll check it against the department list before you continue.'}
          titleClassName="connect-account-title"
          actions={
            <div className="flex flex-wrap gap-2">
              {profile && <Link href="/connect/activity" className="connect-button connect-button-secondary">Activity</Link>}
              <Button variant="quiet" onClick={signOut} disabled={busy}>Sign out</Button>
            </div>
          }
        />

        {profile && (
          <div className="connect-review-banner mb-8">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
              <StatusPill status={profile.approvalStatus} />
              <p className="min-w-0 flex-1 text-xs leading-5 text-[#aab6c2]">
                {profile.reviewNote || (profile.approvalStatus === 'APPROVED'
                  ? 'Your profile has been reviewed.'
                  : profile.approvalStatus === 'PENDING'
                    ? 'The Connect team is checking your details. Your profile will appear here once it’s ready to share.'
                    : 'If you have questions about your profile, get in touch with the Connect team.')}
              </p>
            </div>
            {profile.approvalStatus === 'APPROVED' && (
              <Link href={`/connect/members/${encodeURIComponent(profile.slug)}`} className="connect-inline-link shrink-0">View public profile <ChevronRight size={14} /></Link>
            )}
          </div>
        )}

        {!profile && !usnVerified ? (
          <Panel className="mx-auto max-w-xl p-5 sm:p-8">
            <div className="mb-5">
              <h2 className="font-clash text-2xl text-white">Find your name on the list</h2>
              <p className="mt-2 text-sm leading-6 text-[#9aaab6]">Enter your student number exactly as it appears in your department records. We’ll fetch your official name if it matches.</p>
            </div>
            <Field
              label="Official student number (USN)"
              value={draft.usn}
              onChange={(event) => {
                update('usn', event.target.value.toUpperCase())
                setUsnVerified(false)
                setOfficialName('')
                setFeedback(null)
              }}
              required
              autoComplete="off"
              placeholder="e.g. 4AL22IS001"
            />
            {feedback && <Feedback message={feedback.message} kind={feedback.kind} />}
            <Button
              type="button"
              variant="secondary"
              className="mt-4 w-full"
              loading={busy}
              disabled={draft.usn.trim().length < 3}
              onClick={() => void verifyUsn()}
            >
              Check my student number
            </Button>
            <p className="mt-4 text-center text-[11px] leading-5 text-[#81919e]">
              Can’t find your name or see a mistake? Email <a className="text-[#83d9f0] hover:underline" href="mailto:nexora.ise@ajiet.edu.in">nexora.ise@ajiet.edu.in</a>.
            </p>
          </Panel>
        ) : (
        <form onSubmit={handleSubmit} className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-8">
          <div className="space-y-6">
            <Panel className="p-5 sm:p-7">
              <div className="connect-form-section-heading">
                <div><p className="connect-form-step">01 / BASICS</p><h2 className="connect-form-title">Your details</h2><p className="connect-form-description">Your name and student number are verified against department records.</p></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Student number (USN)" value={draft.usn} readOnly disabled />
                <Field label="Name on department records" value={profile?.fullName ?? officialName} readOnly disabled />
                <Field label="Graduation year" type="number" min="1980" max={new Date().getFullYear() + 8} value={draft.graduationYear} onChange={(event) => update('graduationYear', event.target.value)} required />
                <label className="block">
                  <span className="mb-2 block text-[12px] font-medium text-[#d8e2e9]">I am a</span>
                  <select className="connect-input" value={draft.memberType} onChange={(event) => update('memberType', event.target.value as Draft['memberType'])}>
                    <option value="STUDENT">Current student</option>
                    <option value="ALUMNUS">Alumnus / alumna</option>
                  </select>
                </label>
                <TextField label="A short introduction" className="sm:col-span-2" value={draft.bio} onChange={(event) => update('bio', event.target.value)} maxLength={600} placeholder="A couple of lines about what you care about…" />
                <div className="sm:col-span-2">
                  <span className="mb-2 block text-[12px] font-medium text-[#d8e2e9]">Profile photo</span>
                  <div className="flex flex-wrap items-center gap-4 rounded-xl border border-white/[0.08] bg-black/10 p-3">
                    <div className="connect-avatar h-16 w-16 rounded-xl">
                      {draft.avatarUrl && !avatarPreviewFailed
                        ? <Image src={draft.avatarUrl} alt="Profile photo preview" width={64} height={64} unoptimized className="h-full w-full object-cover" onError={() => setAvatarPreviewFailed(true)} />
                        : <UserRound size={22} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[#c1cdd5]">Upload a JPG, PNG, or WebP photo (up to 5 MB).</p>
                      <p className="mt-1 text-[10px] leading-5 text-[#81919e]">Stored securely in Nexora’s Cloudinary media folder. It appears on your public profile only when you choose to share your profile.</p>
                      {avatarFeedback && <p role="status" className={`mt-1 text-[11px] ${avatarFeedback.startsWith('Photo uploaded') ? 'text-[#82d8ef]' : 'text-[#f0a6a6]'}`}>{avatarFeedback}</p>}
                    </div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      aria-label="Choose a profile photo"
                      disabled={avatarUploading || busy}
                      onChange={(event) => void uploadAvatar(event.target.files?.[0])}
                    />
                    <Button type="button" variant="secondary" loading={avatarUploading} disabled={busy} onClick={() => avatarInputRef.current?.click()}>
                      <Upload size={15} /> {draft.avatarUrl ? 'Change photo' : 'Upload photo'}
                    </Button>
                  </div>
                  <div className="mt-4">
                    <Field
                      label="Or use a photo link"
                      type="url"
                      value={draft.avatarUrl}
                      onChange={(event) => {
                        setAvatarPreviewFailed(false)
                        setAvatarFeedback(null)
                        update('avatarUrl', event.target.value)
                      }}
                      placeholder="https://example.com/your-photo.jpg"
                      hint="Paste a direct, publicly accessible image URL. Your photo link is saved with your profile."
                    />
                  </div>
                </div>
                <Field label="Location" value={draft.location} onChange={(event) => update('location', event.target.value)} placeholder="Mangaluru, India" />
              </div>
            </Panel>

            <Panel className="p-5 sm:p-7">
              <div className="connect-form-section-heading">
                <div><p className="connect-form-step">02 / ABOUT</p><h2 className="connect-form-title">Work & interests</h2><p className="connect-form-description">A few details help others find people with shared interests.</p></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Current role" value={draft.currentRole} onChange={(event) => update('currentRole', event.target.value)} placeholder="e.g. Frontend developer" />
                <Field label="Company or organization" value={draft.company} onChange={(event) => update('company', event.target.value)} placeholder="Optional" />
                <Field label="Skills" value={draft.skills} onChange={(event) => update('skills', event.target.value)} placeholder="React, Python, UI design" hint="Separate items with commas." />
                <Field label="Interests" value={draft.interests} onChange={(event) => update('interests', event.target.value)} placeholder="Open source, robotics…" hint="Separate items with commas." />
                <Field label="Skills you’re developing" value={draft.skillsInDevelopment} onChange={(event) => update('skillsInDevelopment', event.target.value)} placeholder="Cloud, data science…" hint="Separate items with commas." />
              </div>
            </Panel>

            <Panel className="p-5 sm:p-7">
              <div className="connect-form-section-heading">
                <div><p className="connect-form-step">03 / CONTACT</p><h2 className="connect-form-title">Ways to reach you</h2><p className="connect-form-description">Contact details stay private unless you choose to show them.</p></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Contact email" type="email" value={draft.contactEmail} onChange={(event) => update('contactEmail', event.target.value)} placeholder="you@example.com" />
                <Field label="Phone (optional)" type="tel" value={draft.phone} onChange={(event) => update('phone', event.target.value)} placeholder="+91…" />
                <Toggle title="Show my email publicly" checked={draft.contactEmailPublic} onChange={(value) => update('contactEmailPublic', value)} />
                <Toggle title="Show my phone publicly" checked={draft.phonePublic} onChange={(value) => update('phonePublic', value)} />
              </div>
              <p className="mt-4 text-[10px] leading-5 text-[#81919e]">Contact details stay private unless you explicitly turn on public visibility.</p>
            </Panel>

            <Panel className="p-5 sm:p-7">
              <div className="connect-form-section-heading flex-wrap">
                <div><p className="connect-form-step">04 / LINKS</p><h2 className="connect-form-title">Around the web</h2><p className="connect-form-description">Add a portfolio, professional profile, or personal site.</p></div>
                <Button type="button" variant="secondary" onClick={() => setSocialLinks((current) => [...current, { label: '', url: '' }])}><Plus size={15} /> Add link</Button>
              </div>
              {socialLinks.length === 0 && <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-xs text-[#81919e]">Add a portfolio, GitHub, LinkedIn or personal site.</p>}
              <div className="space-y-3">
                {socialLinks.map((link, index) => (
                  <div key={index} className="grid gap-3 sm:grid-cols-[0.7fr_1.3fr_auto]">
                    <Field label={index === 0 ? 'Label' : `Label ${index + 1}`} value={link.label} onChange={(event) => setSocialLinks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} placeholder="GitHub" />
                    <Field label={index === 0 ? 'URL' : `URL ${index + 1}`} type="url" value={link.url} onChange={(event) => setSocialLinks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item))} placeholder="https://…" />
                    <button type="button" onClick={() => setSocialLinks((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="connect-remove-button mt-7" aria-label={`Remove link ${index + 1}`}><X size={15} /></button>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-24">
            <Panel className="p-5 sm:p-6">
              <div className="mb-5">
                <p className="connect-form-step">PREFERENCES</p>
                <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-white">Visibility & availability</h2>
                <p className="mt-2 text-xs leading-5 text-[#9aaab6]">You decide what’s shared and how you’d like to contribute.</p>
              </div>
              <label className="block">
                <span className="mb-2 block text-[12px] font-medium text-[#d8e2e9]">Profile visibility</span>
                <select className="connect-input" value={draft.visibility} onChange={(event) => update('visibility', event.target.value as Draft['visibility'])}>
                  <option value="PRIVATE">Private · only you can see it</option>
                  <option value="PUBLIC">Public · visible to everyone after review</option>
                </select>
              </label>
              <div className="mt-4 space-y-3">
                <Toggle title="Open to collaborate" checked={draft.openToCollaborate} onChange={(value) => update('openToCollaborate', value)} />
                <Toggle title="Available to mentor" checked={draft.mentoringAvailable} onChange={(value) => update('mentoringAvailable', value)} />
                <Toggle title="Open to referrals" checked={draft.referralAvailable} onChange={(value) => update('referralAvailable', value)} />
              </div>
            </Panel>
            <Panel className="p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div>
                  <p className="connect-form-step">PROFILE REVIEW</p>
                  <h3 className="mt-2 font-medium text-white">Shared after review</h3>
                  <p className="mt-2 text-xs leading-5 text-[#9aaab6]">The Connect team checks your details before your profile is shared.</p>
                  <p className="mt-3 flex items-center gap-1.5 text-[10px] text-[#82d8ef]"><Check size={13} /> USN is never shown on your public profile.</p>
                </div>
              </div>
            </Panel>
            <div>
              {feedback && <Feedback message={feedback.message} kind={feedback.kind} />}
              <Button type="submit" loading={busy} disabled={avatarUploading} className="mt-3 w-full"><Save size={16} /> {profile ? 'Save changes' : 'Create profile'}</Button>
              {profile && <p className="mt-2 text-center text-[10px] text-[#788995]">Only your profile is changed when you save.</p>}
            </div>
          </aside>
        </form>
        )}
        {profile && <KnowledgeEditor profileApprovalStatus={profile.approvalStatus} embedded />}
      </div>
    </ConnectShell>
  )
}

function Toggle({ title, checked, onChange }: { title: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="connect-toggle-row">
      <span><strong>{title}</strong></span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  )
}
