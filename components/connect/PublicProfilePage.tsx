'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState, type ReactNode } from 'react'
import { useParams } from 'next/navigation'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowLeft, ArrowUpRight, BriefcaseBusiness, CalendarDays, ExternalLink, Flag, Handshake, MapPin, ShieldCheck, Sparkles } from 'lucide-react'
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
  currentRole: string | null
  company: string | null
  openToCollaborate: boolean
  mentoringAvailable: boolean
  referralAvailable: boolean
  socialLinks: Array<{ id: string; label: string; url: string }>
  experiences: Array<{ id: string; type: string; role: string; organization: string | null; description: string | null; startedAt: string | null; endedAt: string | null; isCurrent: boolean }>
  achievements: Array<{ id: string; title: string; description: string | null; achievedAt: string | null; url: string | null }>
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
      <div className="connect-public-profile mx-auto max-w-[1180px] px-5 pb-20 pt-10 sm:px-8 sm:pt-14 lg:px-12">
        <div className="mb-5 flex items-center justify-between gap-4">
          <Link href="/connect" className="connect-back-link mb-0"><ArrowLeft size={14} /> Community</Link>
          <span className="connect-profile-page-label">MEMBER DIRECTORY</span>
        </div>
        <motion.section
          className="connect-profile-showcase"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="connect-profile-member-card">
            <div className="connect-profile-portrait">
              <div className="connect-avatar connect-avatar-large">
                {profile.avatarUrl
                  ? <Image src={profile.avatarUrl} alt={`${profile.fullName} profile photo`} width={420} height={360} unoptimized className="h-full w-full object-cover" />
                  : initials(profile.fullName)}
              </div>
            </div>
            <div className="connect-profile-member-details">
              <p className="connect-profile-kicker">{profile.memberType === 'ALUMNUS' ? 'ISE ALUMNI' : 'ISE STUDENT'} <span aria-hidden="true">/</span> CLASS OF {profile.graduationYear}</p>
              <h2>{profile.fullName}</h2>
              {profile.location && <p className="connect-profile-location"><MapPin size={14} /> {profile.location}</p>}
              {profile.socialLinks.length > 0 && (
                <div className="connect-profile-socials" aria-label="Social and portfolio links">
                  {profile.socialLinks.map((link) => (
                    <a key={link.id} href={link.url} target="_blank" rel="noreferrer" aria-label={link.label} title={link.label}>
                      {link.label}
                      <ArrowUpRight size={13} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="connect-profile-introduction">
            <h1>{profile.currentRole || 'Information Science'}</h1>
            {profile.company && <p className="connect-profile-company">at {profile.company}</p>}
            <p className="connect-profile-bio">
              {profile.bio || 'A member of the ISE community at AJIET. Explore their background, interests, and ways to connect below.'}
            </p>
            {(profile.openToCollaborate || profile.mentoringAvailable || profile.referralAvailable) && (
              <div className="connect-profile-availability" aria-label="Availability">
                {profile.openToCollaborate && <span className="connect-feature-pill"><Handshake size={14} /> Open to collaborate</span>}
                {profile.mentoringAvailable && <span className="connect-feature-pill"><Sparkles size={14} /> Available to mentor</span>}
                {profile.referralAvailable && <span className="connect-feature-pill"><BriefcaseBusiness size={14} /> Open to referrals</span>}
              </div>
            )}
            <div className="connect-profile-actions">
              {profile.contactEmail && <a href={`mailto:${profile.contactEmail}`} className="connect-button connect-button-primary"><span>Get in touch</span><ArrowUpRight size={15} /></a>}
              <Link href={`/connect/activity?slug=${encodeURIComponent(profile.slug)}`} className="connect-button connect-button-secondary"><Flag size={14} /> Report profile</Link>
            </div>
            <div className="connect-profile-stat-row">
              <ProfileStat value={String(profile.experiences.length).padStart(2, '0')} label={profile.experiences.length === 1 ? 'Experience' : 'Experiences'} />
              <ProfileStat value={String(profile.achievements.length).padStart(2, '0')} label={profile.achievements.length === 1 ? 'Achievement' : 'Achievements'} />
            </div>
          </div>
        </motion.section>

        <div className="connect-profile-layout">
          <div className="connect-profile-main">
            {profile.experiences.length > 0 && (
              <ProfileSection
                label="BACKGROUND"
                title="Experience"
                icon={<CalendarDays size={17} />}
                prefersReducedMotion={prefersReducedMotion}
              >
                <div className="connect-profile-timeline">
                  {profile.experiences.map((experience, index) => (
                    <motion.article
                      key={experience.id}
                      className="connect-timeline-item"
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.25 }}
                      transition={{ duration: 0.35, delay: Math.min(index * 0.07, 0.28) }}
                    >
                      <p className="connect-experience-type">{experience.type.replaceAll('_', ' ')}</p>
                      <h3 className="connect-experience-role">{experience.role}</h3>
                      {experience.organization && <p className="connect-experience-organization">{experience.organization}</p>}
                      {experience.description && <p className="connect-experience-description">{experience.description}</p>}
                      <p className="connect-experience-dates">{experience.startedAt ? new Date(experience.startedAt).getFullYear() : '—'} — {experience.isCurrent ? 'Present' : experience.endedAt ? new Date(experience.endedAt).getFullYear() : '—'}</p>
                    </motion.article>
                  ))}
                </div>
              </ProfileSection>
            )}

            {profile.achievements.length > 0 && (
              <ProfileSection
                label="HIGHLIGHTS"
                title="Achievements"
                prefersReducedMotion={prefersReducedMotion}
              >
                <div className="connect-profile-achievements">
                  {profile.achievements.map((achievement, index) => (
                    <motion.article
                      key={achievement.id}
                      className="connect-profile-achievement"
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.25 }}
                      transition={{ duration: 0.35, delay: Math.min(index * 0.06, 0.24) }}
                    >
                      <div>
                        <h3>{achievement.title}</h3>
                        {achievement.description && <p>{achievement.description}</p>}
                      </div>
                      {achievement.url && <a href={achievement.url} target="_blank" rel="noreferrer" aria-label={`View ${achievement.title}`} className="connect-card-arrow"><ExternalLink size={14} /></a>}
                    </motion.article>
                  ))}
                </div>
              </ProfileSection>
            )}

            {profile.knowledgePage?.publishedMarkdown && (
              <ProfileSection
                label="KNOWLEDGE"
                title="Notes from the field"
                prefersReducedMotion={prefersReducedMotion}
              >
                {profile.knowledgePage.publishedAt && <p className="connect-profile-published">Published {new Date(profile.knowledgePage.publishedAt).toLocaleDateString()}</p>}
                <div className="connect-markdown-preview mt-4"><ConnectMarkdown markdown={profile.knowledgePage.publishedMarkdown} /></div>
              </ProfileSection>
            )}
          </div>

          <aside className="connect-profile-aside">
            {(profile.skills.length > 0 || profile.interests.length > 0 || profile.skillsInDevelopment.length > 0) && (
              <Panel className="connect-profile-card p-5 sm:p-6">
                <ProfileSectionHeading label="AT A GLANCE" title="Toolkit" />
                <div className="mt-5 space-y-5">
                  <SkillGroup title="Skills" items={profile.skills} />
                  <SkillGroup title="Interested in" items={profile.interests} />
                  <SkillGroup title="Currently learning" items={profile.skillsInDevelopment} />
                </div>
              </Panel>
            )}
            <div className="connect-profile-verified"><ShieldCheck size={15} /> ISE affiliation confirmed</div>
          </aside>
        </div>
      </div>
    </ConnectShell>
  )
}

function ProfileStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="connect-profile-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function ProfileSection({
  label,
  title,
  icon,
  prefersReducedMotion,
  children,
}: {
  label: string
  title: string
  icon?: ReactNode
  prefersReducedMotion: boolean | null
  children: ReactNode
}) {
  return (
    <motion.section
      className="connect-profile-card connect-profile-section"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <ProfileSectionHeading label={label} title={title} icon={icon} />
      <div className="connect-profile-section-content">{children}</div>
    </motion.section>
  )
}

function ProfileSectionHeading({ label, title, icon }: { label: string; title: string; icon?: ReactNode }) {
  return (
    <div className="connect-profile-section-heading">
      <div>
        <p className="connect-eyebrow">{label}</p>
        <h2>{title}</h2>
      </div>
      {icon && <span className="connect-profile-heading-icon" aria-hidden="true">{icon}</span>}
    </div>
  )
}

function SkillGroup({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div>
      <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-[#82919e]">{title}</p>
      <div className="flex flex-wrap gap-1.5">{items.map((item) => <span key={item} className="connect-chip">{item}</span>)}</div>
    </div>
  )
}
