'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

type CommunityProfile = {
  slug: string
  fullName: string
  graduationYear: number
  memberType: 'STUDENT' | 'ALUMNUS'
  avatarUrl: string | null
  skills: string[]
  currentRole: string | null
  company: string | null
  projects: Array<{ title: string }>
}

type PreviewItem = {
  title: string
  detail: string
  label: string
  meta?: string
  context?: string
  pinned?: boolean
  image?: string
}

type PreviewData = {
  profiles: CommunityProfile[]
  events: PreviewItem[]
  resources: PreviewItem[]
  notices: PreviewItem[]
  achievements: PreviewItem[]
  errors: Partial<Record<'profiles' | 'events' | 'resources' | 'notices' | 'achievements', string>>
}

const AVATAR_POSITIONS = [
  { left: '4%', top: '14%', size: 88 },
  { left: '19%', top: '2%', size: 72 },
  { left: '34%', top: '17%', size: 104 },
  { left: '54%', top: '2%', size: 80 },
  { left: '71%', top: '19%', size: 70 },
  { left: '14%', top: '56%', size: 72 },
  { left: '38%', top: '57%', size: 82 },
  { left: '61%', top: '52%', size: 94 },
]

const EMPTY_PREVIEW: PreviewData = {
  profiles: [],
  events: [],
  resources: [],
  notices: [],
  achievements: [],
  errors: {},
}

const EMPTY_VISUAL_COPY = {
  events: { eyebrow: 'EVENTS / COMMUNITY', title: 'No upcoming events listed.' },
  learning: { eyebrow: 'LEARNING / RESOURCES', title: 'No published resources listed.' },
  notices: { eyebrow: 'ISE / UPDATES', title: 'No current notices listed.' },
  achievements: { eyebrow: 'MILESTONES / ISE', title: 'No published achievements listed.' },
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function getMemberDetail(profile: CommunityProfile) {
  if (profile.memberType === 'ALUMNUS') {
    return [profile.currentRole, profile.company].filter(Boolean).join(' · ') || 'ISE graduate'
  }
  return profile.skills.slice(0, 2).join(' · ') || profile.projects[0]?.title || 'ISE student'
}

function sectionDetail(error: string | undefined, fallback: string) {
  return error || fallback
}

type PreviewKind = 'events' | 'learning' | 'notices' | 'achievements' | 'practice'

function HomeFeatureSection({
  id,
  href,
  label,
  title,
  detail,
  action,
  items,
  kind,
  emptyMessage,
}: {
  id: string
  href: string
  label: string
  title: string
  detail: string
  action: string
  items: PreviewItem[]
  kind: PreviewKind
  emptyMessage?: string
}) {
  return (
    <section className={`home-feature-section home-feature-section--${kind}`} aria-labelledby={`${id}-heading`}>
      <div className="home-feature-copy">
        <span className="home-preview-label">{label}</span>
        <h3 id={`${id}-heading`}>{title}</h3>
        <p>{detail}</p>
        <Link href={href} className="home-feature-cta">
          {action} <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
      <FeatureVisual kind={kind} items={items} emptyMessage={emptyMessage} />
    </section>
  )
}

function FeatureVisual({ kind, items, emptyMessage }: { kind: PreviewKind; items: PreviewItem[]; emptyMessage?: string }) {
  if (kind === 'events') {
    return (
      <div className="home-feature-visual home-event-board" aria-label="Recent and upcoming events">
        {items.length ? items.slice(0, 2).map((item, index) => (
          <article className="home-event-ticket" key={`${item.title}-${index}`}>
            <div className="home-event-ticket-meta">
              <span className="home-event-ticket-date">{item.meta || 'NEXORA EVENT'}</span>
            </div>
            <strong>{item.title}</strong>
            {item.detail && <p>{item.detail}</p>}
            <small>{item.label}</small>
          </article>
        )) : <EmptyFeature kind={kind} message={emptyMessage} />}
      </div>
    )
  }

  if (kind === 'learning') {
    return (
      <div className="home-feature-visual home-learning-shelf" aria-label="Recently published learning resources">
        {items.length ? items.slice(0, 3).map((item, index) => (
          <article className="home-learning-resource" key={`${item.title}-${index}`}>
            <span className="home-learning-index">{String(index + 1).padStart(2, '0')}</span>
            <div>
              <small>{item.label}{item.meta ? ` · ${item.meta}` : ''}</small>
              <strong>{item.title}</strong>
              <span>{item.detail}</span>
            </div>
          </article>
        )) : <EmptyFeature kind={kind} message={emptyMessage} />}
      </div>
    )
  }

  if (kind === 'notices') {
    const notice = items[0]
    return (
      <div className="home-feature-visual home-notice-board" aria-label="Latest department notice">
        {notice ? (
          <article className="home-notice-paper">
            <div className="home-notice-meta">
              <span>{notice.label}</span>
              {notice.pinned && <span className="home-notice-pinned">Pinned</span>}
            </div>
            <h4>{notice.title}</h4>
            <p>{notice.detail}</p>
            {notice.meta && <small>{notice.meta}</small>}
          </article>
        ) : <EmptyFeature kind={kind} message={emptyMessage} />}
      </div>
    )
  }

  if (kind === 'achievements') {
    return <AchievementShowcase items={items} emptyMessage={emptyMessage} />
  }

  return (
    <div className="home-feature-visual home-practice-terminal" aria-label="Practice coding and aptitude">
      <div className="home-terminal-bar" aria-hidden="true"><i /><i /><i /><span>nexora / practice</span></div>
      <div className="home-terminal-content">
        <span>Practice library</span>
        <strong>Ready<span>_</span></strong>
        <p>Explore coding challenges and aptitude practice.</p>
      </div>
    </div>
  )
}

function EmptyFeature({ kind, message }: { kind: Exclude<PreviewKind, 'practice'>; message?: string }) {
  return (
    <div className="home-feature-empty">
      <span>{EMPTY_VISUAL_COPY[kind].eyebrow}</span>
      <strong>{message || EMPTY_VISUAL_COPY[kind].title}</strong>
    </div>
  )
}

function AchievementShowcase({ items, emptyMessage }: { items: PreviewItem[]; emptyMessage?: string }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const prefersReducedMotion = useReducedMotion()
  const active = items[activeIndex]

  const move = (direction: -1 | 1) => {
    setActiveIndex((current) => (current + direction + items.length) % items.length)
  }

  return (
    <div
      className="home-feature-visual home-achievement-showcase"
      role="group"
      aria-roledescription="carousel"
      aria-label="Published achievements"
    >
      {active ? (
        <>
          <AnimatePresence mode="wait" initial={false}>
            <motion.article
              key={`${active.title}-${activeIndex}`}
              className="home-achievement-slide"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.24 }}
              aria-live="polite"
              aria-roledescription="slide"
              aria-label={`${activeIndex + 1} of ${items.length}`}
            >
              {active.image && (
                <Image
                  src={active.image}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 90vw, 45vw"
                  unoptimized
                  className="home-achievement-image"
                />
              )}
              <div className="home-achievement-badges">
                <span className="home-achievement-category">{active.label}</span>
              </div>
              <strong>{active.title}</strong>
              <p>{active.detail}</p>
              {(active.context || active.meta) && (
                <small>{[active.context, active.meta].filter(Boolean).join(' · ')}</small>
              )}
            </motion.article>
          </AnimatePresence>
          {items.length > 1 && (
            <div className="home-achievement-controls">
              <span>{String(activeIndex + 1).padStart(2, '0')} <i>/</i> {String(items.length).padStart(2, '0')}</span>
              <div>
                <button type="button" aria-label="Previous achievement" onClick={() => move(-1)}>
                  <ChevronLeft size={17} aria-hidden="true" />
                </button>
                <button type="button" aria-label="Next achievement" onClick={() => move(1)}>
                  <ChevronRight size={17} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : <EmptyFeature kind="achievements" message={emptyMessage} />}
    </div>
  )
}

function MemberAvatar({
  profile,
  position,
  index,
}: {
  profile: CommunityProfile
  position: (typeof AVATAR_POSITIONS)[number]
  index: number
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const memberType = profile.memberType === 'ALUMNUS' ? 'Graduate' : 'Student'
  const detail = getMemberDetail(profile)
  const accessibleDescription = `${profile.fullName}, ${memberType}, class of ${profile.graduationYear}. ${detail}. View full profile.`

  return (
    <Link
      href={`/connect/members/${encodeURIComponent(profile.slug)}`}
      aria-label={accessibleDescription}
      className="home-connect-avatar group"
      style={{
        left: position.left,
        top: position.top,
        width: position.size,
        height: position.size,
        zIndex: 1,
        animationDelay: `${index * -0.55}s`,
      }}
    >
      <span className="home-connect-initials" aria-hidden="true">{initials(profile.fullName)}</span>
      {profile.avatarUrl && !imageFailed && (
        <Image
          src={profile.avatarUrl}
          alt=""
          fill
          sizes={`${position.size}px`}
          unoptimized
          className="home-connect-avatar-image"
          onError={() => setImageFailed(true)}
        />
      )}
      <span className="home-connect-hover-card" aria-hidden="true">
        <strong>{profile.fullName}</strong>
        <small>{memberType} · Class of {profile.graduationYear}</small>
        <small>{detail}</small>
      </span>
    </Link>
  )
}

export default function HomeSectionPreviews() {
  const [preview, setPreview] = useState(EMPTY_PREVIEW)
  const [profilesLoading, setProfilesLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    async function load<T>(url: string): Promise<T> {
      const response = await fetch(url, { cache: 'no-store', signal: controller.signal })
      if (!response.ok) throw new Error(`Preview request failed: ${response.status}`)
      return response.json() as Promise<T>
    }

    void Promise.allSettled([
      load<{ profiles?: CommunityProfile[] }>('/api/connect/members?limit=8'),
      load<{ events?: Array<{ title: string; category: string; description: string; startDate: string | null; dateDisplay: string | null }> }>('/api/events'),
      load<{ resources?: Array<{ title: string; subject: string; semester: number | null; category: string }> }>('/api/resources'),
      load<{ notices?: Array<{ title: string; summary: string | null; category: string; date: string; isPinned: boolean }> }>('/api/notices'),
      load<{ achievements?: Array<{
        title: string
        description: string
        category: string
        studentOrTeamName: string | null
        competitionOrEvent: string | null
        image: string | null
        dateDisplay: string | null
        achievementDate: string | null
      }> }>('/api/achievements'),
    ]).then(([profilesResult, eventsResult, resourcesResult, noticesResult, achievementsResult]) => {
      if (controller.signal.aborted) return
      const errors: PreviewData['errors'] = {}
      if (profilesResult.status === 'rejected') errors.profiles = 'Community profiles are temporarily unavailable.'
      if (eventsResult.status === 'rejected') errors.events = 'Event previews are temporarily unavailable.'
      if (resourcesResult.status === 'rejected') errors.resources = 'Learning previews are temporarily unavailable.'
      if (noticesResult.status === 'rejected') errors.notices = 'Notice previews are temporarily unavailable.'
      if (achievementsResult.status === 'rejected') errors.achievements = 'Achievement previews are temporarily unavailable.'

      const events = eventsResult.status === 'fulfilled' ? eventsResult.value.events ?? [] : []
      const resources = resourcesResult.status === 'fulfilled' ? resourcesResult.value.resources ?? [] : []
      const notices = noticesResult.status === 'fulfilled' ? noticesResult.value.notices ?? [] : []
      const achievements = achievementsResult.status === 'fulfilled' ? achievementsResult.value.achievements ?? [] : []

      setPreview({
        profiles: profilesResult.status === 'fulfilled' ? profilesResult.value.profiles ?? [] : [],
        events: events.slice(0, 2).map((event) => ({
          title: event.title,
          detail: event.description,
          label: event.category,
          meta: event.dateDisplay || event.startDate?.slice(0, 10) || undefined,
        })),
        resources: resources.slice(0, 3).map((resource) => ({
          title: resource.title,
          detail: resource.subject,
          label: resource.category,
          meta: resource.semester ? `Semester ${resource.semester}` : undefined,
        })),
        notices: notices.slice(0, 1).map((notice) => ({
          title: notice.title,
          detail: notice.summary || notice.date,
          label: notice.category,
          meta: notice.date,
          pinned: notice.isPinned,
        })),
        achievements: achievements.slice(0, 5).map((achievement) => ({
          title: achievement.title,
          detail: achievement.description,
          label: achievement.category,
          context: [achievement.studentOrTeamName, achievement.competitionOrEvent].filter(Boolean).join(' · '),
          meta: achievement.dateDisplay || achievement.achievementDate?.slice(0, 10),
          image: achievement.image || undefined,
        })),
        errors,
      })
      setProfilesLoading(false)
    })

    return () => controller.abort()
  }, [])

  const positions = AVATAR_POSITIONS
  const profiles = preview.profiles.slice(0, positions.length)

  return (
    <section aria-labelledby="home-sections-heading" className="home-sections-preview px-6 py-20 sm:px-10 sm:py-24 md:px-16 lg:px-24 xl:px-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-3xl">
          <p className="home-section-eyebrow">Nexora · Your ISE community</p>
          <h2 id="home-sections-heading" className="mt-3 font-clash text-3xl font-bold tracking-tight text-[var(--theme-bg-hero,#dce6ef)] sm:text-4xl">
            Find your next <span className="text-[var(--theme-primary,#00f0ff)]">starting point.</span>
          </h2>
          <p className="mt-3 max-w-2xl font-cabinet text-sm leading-6 text-white/65 sm:text-base">
            Explore what the ISE community is learning, building, sharing, and celebrating.
          </p>
        </div>

        <section className="home-connect-preview" aria-labelledby="home-connect-heading">
          <div className="home-connect-copy">
            <p className="home-preview-label">Nexora Connect</p>
            <h3 id="home-connect-heading">Good people make the path easier.</h3>
            <p>Find students and graduates by skill, role, or company. Reach out for guidance, collaboration, referral advice, and interview insights.</p>
            <Link href="/connect" className="home-connect-cta">
              Explore Everyone <ArrowRight size={16} aria-hidden="true" />
            </Link>
            {preview.errors.profiles && <p className="home-preview-error" role="status">{preview.errors.profiles}</p>}
            {!preview.errors.profiles && profiles.length === 0 && (
              <p className="home-connect-empty" role="status">
                {profilesLoading ? 'Finding public member profiles…' : 'Public member profiles will appear here as the community grows.'}
              </p>
            )}
          </div>

          <div className="home-connect-orbit" aria-label="Public student and graduate profiles">
            {profiles.map((profile, index) => (
              <MemberAvatar key={profile.slug} profile={profile} position={positions[index]} index={index} />
            ))}
          </div>
        </section>

        <div className="home-feature-list" aria-label="Explore Nexora sections">
          <HomeFeatureSection
            id="home-events"
            href="/events"
            label="Events & Hackathons"
            title="Make something real."
            detail={sectionDetail(preview.errors.events, 'Join the workshops, hackathons, and showcases happening across ISE.')}
            action="Explore events"
            items={preview.events}
            kind="events"
            emptyMessage={preview.errors.events}
          />
          <HomeFeatureSection
            id="home-learning"
            href="/learn"
            label="Learning Hub"
            title="Keep building your skills."
            detail={sectionDetail(preview.errors.resources, 'Find study materials, exam updates, and practical learning tracks.')}
            action="Visit the learning hub"
            items={preview.resources}
            kind="learning"
            emptyMessage={preview.errors.resources}
          />
          <HomeFeatureSection
            id="home-notices"
            href="/notices"
            label="Department Notices"
            title="Stay in the loop."
            detail={sectionDetail(preview.errors.notices, 'Important updates and announcements from the department.')}
            action="Read notices"
            items={preview.notices}
            kind="notices"
            emptyMessage={preview.errors.notices}
          />
          <HomeFeatureSection
            id="home-achievements"
            href="/achievements"
            label="Achievements"
            title="Celebrate the work."
            detail={sectionDetail(preview.errors.achievements, 'A look at the ideas, milestones, and wins from our community.')}
            action="See achievements"
            items={preview.achievements}
            kind="achievements"
            emptyMessage={preview.errors.achievements}
          />
          <HomeFeatureSection
            id="home-practice"
            href="/practice"
            label="Practice"
            title="Think it through. Then solve it."
            detail="Try coding challenges or sharpen your aptitude with a fresh set of questions."
            action="Start practicing"
            items={[]}
            kind="practice"
          />
        </div>
      </div>
    </section>
  )
}
