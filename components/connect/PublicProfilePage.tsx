'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowLeft, ArrowUpRight, Flag, MapPin, ShieldCheck } from 'lucide-react'
import { ConnectShell } from './ConnectShell'
import { ConnectMarkdown } from './ConnectMarkdown'
import { Panel } from './ConnectUI'

type PublicProfile = {
  slug: string
  fullName: string
  graduationYear: number
  memberType: 'STUDENT' | 'ALUMNUS'
  bio: string | null
  avatarUrl: string | null
  skills: string[]
  interests: string[]
  skillsInDevelopment: string[]
  location: string | null
  contactEmail: string | null
  phone: string | null
  currentRole: string | null
  company: string | null
  openToCollaborate: boolean
  mentoringAvailable: boolean
  referralAvailable: boolean
  socialLinks: Array<{ id: string; label: string; url: string }>
  knowledgePage: { publishedMarkdown: string | null; publishedAt: string | null } | null
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

export default function PublicProfilePage() {
  const params = useParams<{ slug: string }>()
  const prefersReducedMotion = useReducedMotion()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void fetch(`/api/connect/members/${encodeURIComponent(params.slug)}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'This member profile could not be found.')
        if (active) setProfile(data.profile)
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : 'This member profile could not be found.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [params.slug])

  if (loading) return <ConnectShell><div className="mx-auto max-w-[1000px] px-5 py-16 sm:px-8"><div className="connect-skeleton h-64" /></div></ConnectShell>

  if (error || !profile) {
    return (
      <ConnectShell>
        <div className="mx-auto max-w-[1000px] px-5 py-20 sm:px-8">
          <Panel className="mx-auto max-w-lg p-8 text-center">
            <span className="connect-empty-icon"><ShieldCheck size={22} /></span>
            <p className="connect-eyebrow mt-5">Not found</p>
            <h1 className="mt-2 font-clash text-3xl text-white">This profile isn’t available.</h1>
            <p className="mt-3 text-sm text-[#aab6c2]">{error || 'This profile may be private or not ready to share yet.'}</p>
            <Link href="/connect" className="connect-button connect-button-primary mt-6"><ArrowLeft size={15} /> Back to the community</Link>
          </Panel>
        </div>
      </ConnectShell>
    )
  }

  return (
    <ConnectShell>
      <main className="connect-public-profile mx-auto max-w-[1180px] px-5 pb-20 pt-10 sm:px-8 sm:pt-14 lg:px-12">
        <nav className="connect-profile-top-nav">
          <Link href="/connect" className="connect-back-link mb-0"><ArrowLeft size={14} /> Community</Link>
          <span className="connect-profile-page-label">MEMBER DIRECTORY</span>
        </nav>
        <div className="connect-public-profile-layout">
          <motion.aside
            className="connect-profile-sidebar"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="connect-profile-photo">
              <div className="connect-avatar connect-avatar-large">
                {profile.avatarUrl
                  ? <Image src={profile.avatarUrl} alt={`${profile.fullName} profile photo`} width={420} height={420} unoptimized className="h-full w-full object-cover" />
                  : initials(profile.fullName)}
              </div>
            </div>
            <h1 className="connect-profile-name">{profile.fullName}</h1>
            <p className="connect-profile-verified"><ShieldCheck size={16} aria-hidden="true" /> ISE affiliation confirmed</p>
            <div className="connect-profile-role">
              <p>{profile.currentRole || 'Information Science'}</p>
              {profile.company && <span>at {profile.company}</span>}
            </div>
            <p className="connect-profile-tag">{profile.memberType === 'ALUMNUS' ? 'ISE ALUMNI' : 'ISE STUDENT'} <span aria-hidden="true">/</span> CLASS OF {profile.graduationYear}</p>
            {profile.location && <p className="connect-profile-location"><MapPin size={16} aria-hidden="true" /> <span>{profile.location}</span></p>}
            {(profile.openToCollaborate || profile.mentoringAvailable || profile.referralAvailable) && (
              <div className="connect-profile-availability" aria-label="Availability">
                {profile.openToCollaborate && <span className="connect-feature-pill">Open to collaborate</span>}
                {profile.mentoringAvailable && <span className="connect-feature-pill">Available to mentor</span>}
                {profile.referralAvailable && <span className="connect-feature-pill">Open to referrals</span>}
              </div>
            )}
            <div className="connect-profile-contact-actions">
              {profile.contactEmail && (
                <a href={`mailto:${profile.contactEmail}`} className="connect-button connect-button-primary connect-profile-contact-button">
                  <span>Get in touch</span><ArrowUpRight size={16} aria-hidden="true" />
                </a>
              )}
              {profile.phone && (
                <a href={`tel:${profile.phone}`} className="connect-button connect-button-secondary connect-profile-phone-button">
                  {profile.phone}
                </a>
              )}
            </div>
            {profile.socialLinks.length > 0 && (
              <div className="connect-profile-socials" aria-label="Social and portfolio links">
                {profile.socialLinks.map((link) => (
                  <a key={link.id} href={link.url} target="_blank" rel="noreferrer" aria-label={link.label} title={link.label}>
                    <span>{link.label}</span><ArrowUpRight size={15} aria-hidden="true" />
                  </a>
                ))}
              </div>
            )}
            <Link href={`/connect/activity?slug=${encodeURIComponent(profile.slug)}`} className="connect-profile-report">
              <Flag size={15} aria-hidden="true" /> Report profile
            </Link>
          </motion.aside>

          <div className="connect-profile-reading">
            <p className="connect-profile-lead">
              {profile.bio || 'A member of the ISE community at AJIET. Explore their background, interests, and ways to connect below.'}
            </p>

            {(profile.skills.length > 0 || profile.interests.length > 0 || profile.skillsInDevelopment.length > 0) && (
              <section className="connect-profile-toolkit" aria-labelledby="connect-profile-toolkit-title">
                <div className="connect-profile-section-heading">
                  <div>
                    <p className="connect-profile-eyebrow">AT A GLANCE</p>
                    <h2 id="connect-profile-toolkit-title">Toolkit</h2>
                  </div>
                </div>
                <div className="connect-profile-toolkit-groups">
                  <SkillGroup title="Skills" items={profile.skills} />
                  <SkillGroup title="Interested in" items={profile.interests} />
                  <SkillGroup title="Currently learning" items={profile.skillsInDevelopment} />
                </div>
              </section>
            )}

            {profile.knowledgePage?.publishedMarkdown && (
              <article className="connect-profile-knowledge">
                <header className="connect-profile-section-heading">
                  <div>
                    <p className="connect-profile-eyebrow">KNOWLEDGE</p>
                    <h2>Notes from the field</h2>
                  </div>
                </header>
                {profile.knowledgePage.publishedAt && <p className="connect-profile-published">Published {new Date(profile.knowledgePage.publishedAt).toLocaleDateString()}</p>}
                <div className="connect-markdown-preview connect-profile-markdown">
                  <ConnectMarkdown markdown={profile.knowledgePage.publishedMarkdown} />
                </div>
              </article>
            )}
          </div>
        </div>
      </main>
    </ConnectShell>
  )
}

function SkillGroup({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="connect-profile-toolkit-group">
      <p className="connect-profile-eyebrow">{title}</p>
      <div className="connect-profile-chips">{items.map((item) => <span key={item} className="connect-chip">{item}</span>)}</div>
    </div>
  )
}
