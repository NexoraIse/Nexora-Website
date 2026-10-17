import { NextResponse } from 'next/server'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { publicMemberProfileSelect, toPublicMemberProfile } from '@/lib/connect/public-profile'
import {
  ConnectRequestError,
  requestErrorResponse,
  rethrowNextControlFlow,
} from '@/lib/connect/validation'

type DirectoryProfile = Prisma.MemberProfileGetPayload<{
  select: typeof publicMemberProfileSelect
}>
type DirectoryProfileWithMatches = DirectoryProfile & {
  searchMatches?: Array<{ section: string; excerpt: string }>
}

function parseBoundedInteger(value: string | null, name: string, min: number, max: number, fallback: number) {
  if (value === null) return fallback
  if (!/^\d+$/.test(value)) {
    throw new ConnectRequestError(`${name} must be a whole number.`)
  }
  const number = Number(value)
  if (number < min || number > max) {
    throw new ConnectRequestError(`${name} must be between ${min} and ${max}.`)
  }
  return number
}

function searchableText(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<https?:\/\/[^>]+>/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[`*_~>#|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function searchMatches(profile: DirectoryProfile, terms: string[]) {
  const sources: Array<{ section: string; text: string }> = [
    { section: 'Name', text: profile.fullName },
    { section: 'About', text: profile.bio ?? '' },
    { section: 'Role', text: [profile.currentRole, profile.company].filter(Boolean).join(' ') },
    { section: 'Location', text: profile.location ?? '' },
    { section: 'Skills', text: profile.skills.join(' ') },
    { section: 'Interests', text: profile.interests.join(' ') },
    { section: 'Learning', text: profile.skillsInDevelopment.join(' ') },
    { section: 'Experience', text: profile.experiences.map((item) => [item.role, item.organization, item.description].filter(Boolean).join(' ')).join(' ') },
    { section: 'Achievements', text: profile.achievements.map((item) => [item.title, item.description, item.url].filter(Boolean).join(' ')).join(' ') },
    { section: 'Links', text: profile.socialLinks.map((item) => [item.label, item.url].join(' ')).join(' ') },
    { section: 'Knowledge page', text: searchableText(profile.knowledgePage?.publishedMarkdown ?? '') },
    { section: 'Class year', text: String(profile.graduationYear) },
    { section: 'Community role', text: profile.memberType === 'ALUMNUS' ? 'Alumni graduate' : 'Student' },
    { section: 'Availability', text: [profile.openToCollaborate && 'Open to collaborate', profile.mentoringAvailable && 'Available to mentor', profile.referralAvailable && 'Open to referrals'].filter(Boolean).join(' ') },
  ]

  const matches = new Map<string, string>()
  for (const source of sources) {
    const normalized = source.text.toLocaleLowerCase()
    const matchingTerm = terms.find((term) => normalized.includes(term.toLocaleLowerCase()))
    if (!matchingTerm) continue

    const index = normalized.indexOf(matchingTerm.toLocaleLowerCase())
    const start = Math.max(0, index - 55)
    const end = Math.min(source.text.length, index + matchingTerm.length + 95)
    const excerpt = `${start > 0 ? '…' : ''}${source.text.slice(start, end)}${end < source.text.length ? '…' : ''}`
    matches.set(source.section, excerpt)
    if (matches.size === 3) break
  }
  return [...matches].map(([section, excerpt]) => ({ section, excerpt }))
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseBoundedInteger(searchParams.get('page'), 'page', 1, 1_000_000, 1)
    const limit = parseBoundedInteger(searchParams.get('limit'), 'limit', 1, 50, 20)
    const search = searchParams.get('q')?.trim() ?? ''
    if (search.length > 100) throw new ConnectRequestError('q cannot exceed 100 characters.')

    const memberType = searchParams.get('memberType')
    if (memberType && memberType !== 'STUDENT' && memberType !== 'ALUMNUS') {
      throw new ConnectRequestError('memberType must be STUDENT or ALUMNUS.')
    }
    const memberTypeFilter: 'STUDENT' | 'ALUMNUS' | undefined =
      memberType === 'STUDENT' || memberType === 'ALUMNUS' ? memberType : undefined

    const yearParam = searchParams.get('graduationYear')
    const graduationYear = yearParam === null
      ? undefined
      : parseBoundedInteger(yearParam, 'graduationYear', 1980, new Date().getFullYear() + 8, 0)
    const skill = searchParams.get('skill')?.trim()
    if (skill && (skill.length > 60 || skill.length < 1)) {
      throw new ConnectRequestError('skill must be between 1 and 60 characters.')
    }

    const where: Prisma.MemberProfileWhereInput = {
      approvalStatus: 'APPROVED' as const,
      visibility: 'PUBLIC' as const,
      ...(memberTypeFilter ? { memberType: memberTypeFilter } : {}),
      ...(graduationYear !== undefined ? { graduationYear } : {}),
      ...(skill ? { skills: { has: skill } } : {}),
    }

    let profiles: DirectoryProfileWithMatches[]
    let total: number

    if (search) {
      const terms = search.split(/\s+/).filter(Boolean)
      const textFields = [
        Prisma.sql`p.full_name`,
        Prisma.sql`p.bio`,
        Prisma.sql`p.current_role`,
        Prisma.sql`p.company`,
        Prisma.sql`p.location`,
        Prisma.sql`array_to_string(p.skills, ' ')`,
        Prisma.sql`array_to_string(p.interests, ' ')`,
        Prisma.sql`array_to_string(p.skills_in_development, ' ')`,
        Prisma.sql`CASE WHEN p.open_to_collaborate THEN 'open to collaborate' ELSE '' END`,
        Prisma.sql`CASE WHEN p.mentoring_available THEN 'available to mentor mentoring' ELSE '' END`,
        Prisma.sql`CASE WHEN p.referral_available THEN 'open to referrals referral' ELSE '' END`,
      ]
      const termConditions = terms.map((term) => {
        const fieldConditions = textFields.map((field) => Prisma.sql`strpos(lower(coalesce(${field}, '')), lower(${term})) > 0`)
        fieldConditions.push(
          Prisma.sql`strpos(lower(CASE WHEN p.member_type = 'ALUMNUS' THEN 'alumni graduate alumnus' ELSE 'student' END), lower(${term})) > 0`,
          Prisma.sql`strpos(p.graduation_year::text, ${term}) > 0`,
          Prisma.sql`EXISTS (SELECT 1 FROM connect_member_experiences x WHERE x.profile_id = p.auth_user_id AND strpos(lower(concat_ws(' ', x.role, x.organization, x.description)), lower(${term})) > 0)`,
          Prisma.sql`EXISTS (SELECT 1 FROM connect_member_achievements x WHERE x.profile_id = p.auth_user_id AND strpos(lower(concat_ws(' ', x.title, x.description, x.url)), lower(${term})) > 0)`,
          Prisma.sql`EXISTS (SELECT 1 FROM connect_member_social_links x WHERE x.profile_id = p.auth_user_id AND strpos(lower(concat_ws(' ', x.label, x.url)), lower(${term})) > 0)`,
          Prisma.sql`EXISTS (SELECT 1 FROM connect_member_knowledge_pages x WHERE x.profile_id = p.auth_user_id AND x.published_markdown IS NOT NULL AND strpos(lower(x.published_markdown), lower(${term})) > 0)`
        )
        return Prisma.sql`(${Prisma.join(fieldConditions, ' OR ')})`
      })
      const filters: Prisma.Sql[] = [
        Prisma.sql`p.approval_status = 'APPROVED'`,
        Prisma.sql`p.visibility = 'PUBLIC'`,
        ...termConditions,
      ]
      if (memberTypeFilter) filters.push(Prisma.sql`p.member_type = ${memberTypeFilter}::"MemberType"`)
      if (graduationYear !== undefined) filters.push(Prisma.sql`p.graduation_year = ${graduationYear}`)
      if (skill) filters.push(Prisma.sql`${skill} = ANY(p.skills)`)
      const filterSql = Prisma.join(filters, ' AND ')

      const [rows, countRows] = await Promise.all([
        prisma.$queryRaw<Array<{ slug: string }>>(Prisma.sql`
          SELECT p.slug
          FROM connect_member_profiles p
          WHERE ${filterSql}
          ORDER BY p.full_name ASC, p.auth_user_id ASC
          LIMIT ${limit} OFFSET ${(page - 1) * limit}
        `),
        prisma.$queryRaw<Array<{ total: number }>>(Prisma.sql`
          SELECT count(*)::int AS total
          FROM connect_member_profiles p
          WHERE ${filterSql}
        `),
      ])
      total = countRows[0]?.total ?? 0
      const pageProfiles = rows.length
        ? await prisma.memberProfile.findMany({
            where: { slug: { in: rows.map((row) => row.slug) } },
            select: publicMemberProfileSelect,
          })
        : []
      const profilesBySlug = new Map(pageProfiles.map((profile) => [profile.slug, profile]))
      profiles = rows.flatMap((row) => {
        const profile = profilesBySlug.get(row.slug)
        return profile ? [{ ...profile, searchMatches: searchMatches(profile, terms) }] : []
      })
    } else {
      const [pageProfiles, count] = await Promise.all([
        prisma.memberProfile.findMany({
          where,
          select: publicMemberProfileSelect,
          orderBy: [{ fullName: 'asc' }, { authUserId: 'asc' }],
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.memberProfile.count({ where }),
      ])
      total = count
      profiles = pageProfiles
    }

    return NextResponse.json(
      {
        profiles: profiles.map((profile) => ({
          ...toPublicMemberProfile(profile),
          ...('searchMatches' in profile ? { searchMatches: profile.searchMatches } : {}),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { headers: { 'Cache-Control': 'private, no-store' } }
    )
  } catch (error) {
    rethrowNextControlFlow(error)
    const requestError = requestErrorResponse(error)
    if (requestError) return requestError

    console.error('Connect directory fetch failed:', error)
    return NextResponse.json({ error: 'Failed to load the Connect directory.' }, { status: 500 })
  }
}
