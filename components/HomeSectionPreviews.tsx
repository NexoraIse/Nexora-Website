'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import HomeEventsSection from '@/components/HomeEventsSection'
import HomeAchievementsSection from '@/components/HomeAchievementsSection'
import HomeGallerySection from '@/components/HomeGallerySection'
import HomeLearnPracticeSection from '@/components/HomeLearnPracticeSection'
import type { HomepageAchievement } from '@/lib/home-achievements'
import type { EventItem } from '@/lib/types'
import type { HomepageLearningData } from '@/lib/home-learning'

type CommunityProfile = {
  slug: string
  fullName: string
  graduationYear: number
  memberType: 'STUDENT' | 'ALUMNUS'
  avatarUrl: string | null
  skills?: string[]
  currentRole?: string | null
  company?: string | null
  projects?: Array<{ title: string }>
  experiences?: Array<{ role?: string; organization?: string }>
  achievements?: Array<{ title?: string }>
}

type PreviewData = {
  profiles: CommunityProfile[]
  errors: Partial<Record<'profiles', string>>
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
  errors: {},
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function getMemberDetail(profile: CommunityProfile) {
  if (profile.memberType === 'ALUMNUS') {
    return [profile.currentRole, profile.company].filter(Boolean).join(' · ') || 'ISE graduate'
  }
  return (
    profile.skills?.slice(0, 2).join(' · ') ||
    profile.projects?.[0]?.title ||
    profile.experiences?.[0]?.role ||
    profile.achievements?.[0]?.title ||
    'ISE student'
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

export default function HomeSectionPreviews({
  events,
  initialNow,
  learning,
  achievements,
  achievementsUnavailable,
  codeTokens,
}: {
  events: EventItem[]
  initialNow: number
  learning: HomepageLearningData
  achievements: HomepageAchievement[]
  achievementsUnavailable: boolean
  codeTokens: Array<Array<{ content: string; color?: string; offset: number }>>
}) {
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
    ]).then(([profilesResult]) => {
      if (controller.signal.aborted) return
      const errors: PreviewData['errors'] = {}
      if (profilesResult.status === 'rejected') errors.profiles = 'Community profiles are temporarily unavailable.'

      setPreview({
        profiles: profilesResult.status === 'fulfilled' ? profilesResult.value.profiles ?? [] : [],
        errors,
      })
      setProfilesLoading(false)
    })

    return () => controller.abort()
  }, [])

  const positions = AVATAR_POSITIONS
  const profiles = preview.profiles.slice(0, positions.length)

  return (
    <>
    <section aria-labelledby="home-sections-heading" className="px-4 py-20 sm:px-6 sm:py-24 md:px-16 lg:px-24 xl:px-32">
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

        <HomeEventsSection events={events} initialNow={initialNow} />

        <HomeLearnPracticeSection data={learning} codeTokens={codeTokens} />
      </div>
    </section>
    <HomeAchievementsSection achievements={achievements} unavailable={achievementsUnavailable} />
    <HomeGallerySection />
    </>
  )
}
