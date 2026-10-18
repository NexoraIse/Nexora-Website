import { NextResponse } from 'next/server'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import {
  getAuthenticatedMember,
  getVerifiedMember,
  isSameOriginRequest,
} from '@/lib/connect/auth'
import {
  booleanValue,
  CONNECT_SUPPORT_EMAIL,
  ConnectRequestError,
  integerValue,
  isRecord,
  normalizePersonName,
  normalizeSignupUsn,
  optionalDate,
  optionalEmail,
  optionalString,
  readJsonObject,
  requestErrorResponse,
  requiredString,
  stringArray,
  validatedHttpUrl,
} from '@/lib/connect/validation'

const profileInclude = {
  socialLinks: { orderBy: { sortOrder: 'asc' as const } },
  experiences: { orderBy: { sortOrder: 'asc' as const } },
  achievements: { orderBy: { sortOrder: 'asc' as const } },
  knowledgePage: true,
}

function makeSlug(fullName: string, userId: string): string {
  const base = fullName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 75)
  return `${base || 'member'}-${userId.replace(/-/g, '').slice(-12)}`
}

export async function GET() {
  try {
    const user = await getAuthenticatedMember()
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    const profile = await prisma.memberProfile.findUnique({
      where: { authUserId: user.id },
      include: profileInclude,
    })

    return NextResponse.json(
      { profile },
      { headers: { 'Cache-Control': 'private, no-store' } }
    )
  } catch (error) {
    console.error('Connect member profile fetch failed:', error)
    return NextResponse.json({ error: 'Failed to load the member profile.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    if (!isSameOriginRequest(req)) {
      return NextResponse.json({ error: 'Forbidden request origin.' }, { status: 403 })
    }

    const user = await getVerifiedMember()
    if (!user) {
      return NextResponse.json(
        { error: 'Continue with a Google account that has a verified email address to create a profile.' },
        { status: 401 }
      )
    }
    if (!user.email || !user.email_confirmed_at) {
      return NextResponse.json(
        { error: 'Continue with a Google account that has a verified email address to create a profile.' },
        { status: 401 }
      )
    }
    const verifiedEmail = user.email.toLowerCase()
    const emailConfirmedAt = new Date(user.email_confirmed_at)

    const body = await readJsonObject(req)
    const usn = normalizeSignupUsn(body.usn)
    const registration = await prisma.connectRegistration.findUnique({
      where: { authUserId: user.id },
      select: { id: true, usn: true, authUserId: true },
    }) ?? (user.email
      ? await prisma.connectRegistration.findUnique({
          where: { email: user.email.toLowerCase() },
          select: { id: true, usn: true, authUserId: true },
        }).then((record) => record?.authUserId ? null : record)
      : null)
    if (registration && !registration.authUserId) {
      await prisma.connectRegistration.update({
        where: { id: registration.id },
        data: { authUserId: user.id, emailConfirmedAt: user.email_confirmed_at ? new Date(user.email_confirmed_at) : null },
      })
    }
    const legacySignupUsn = user.user_metadata?.connect_usn
    const registeredUsn = registration?.usn
      ?? (typeof legacySignupUsn === 'string' ? normalizeSignupUsn(legacySignupUsn) : null)
    if (registeredUsn && registeredUsn !== usn) {
      return NextResponse.json(
        { error: `Use the USN you verified when creating your account. Contact ${CONNECT_SUPPORT_EMAIL} if you need help.` },
        { status: 422 }
      )
    }
    const submittedName =
      body.fullName === undefined ? null : requiredString(body.fullName, 'fullName', 120)
    const graduationYear = integerValue(body.graduationYear, 'graduationYear', 1980, new Date().getFullYear() + 8)
    if (body.memberType !== 'STUDENT' && body.memberType !== 'ALUMNUS') {
      throw new ConnectRequestError('memberType must be STUDENT or ALUMNUS.')
    }
    const memberType: 'STUDENT' | 'ALUMNUS' = body.memberType
    const requestedVisibility = body.visibility
    if (
      requestedVisibility !== undefined &&
      requestedVisibility !== 'PUBLIC' &&
      requestedVisibility !== 'PRIVATE'
    ) {
      throw new ConnectRequestError('visibility must be PUBLIC or PRIVATE.')
    }
    const visibility: 'PUBLIC' | 'PRIVATE' = requestedVisibility ?? 'PUBLIC'

    const rosterEntry = await prisma.usnRosterEntry.findFirst({
      where: { usn, isActive: true },
    })
    if (
      !rosterEntry ||
      (submittedName &&
        normalizePersonName(rosterEntry.fullName) !== normalizePersonName(submittedName))
    ) {
      return NextResponse.json(
        { error: `Enter a valid USN or contact ${CONNECT_SUPPORT_EMAIL} if you think this is a mistake.` },
        { status: 422 }
      )
    }
    const fullName = rosterEntry.fullName

    const userFields = {
      fullName,
      usn,
      graduationYear,
      memberType,
      bio: optionalString(body.bio, 'bio', 600),
      avatarUrl: body.avatarUrl ? validatedHttpUrl(body.avatarUrl, 'avatarUrl') : null,
      skills: body.skills === undefined ? [] : stringArray(body.skills, 'skills'),
      interests: body.interests === undefined ? [] : stringArray(body.interests, 'interests'),
      skillsInDevelopment:
        body.skillsInDevelopment === undefined
          ? []
          : stringArray(body.skillsInDevelopment, 'skillsInDevelopment'),
      location: optionalString(body.location, 'location', 120),
      phone: optionalString(body.phone, 'phone', 40),
      contactEmail: optionalEmail(body.contactEmail ?? user.email, 'contactEmail'),
      visibility,
      currentRole: optionalString(body.currentRole, 'currentRole', 160),
      company: optionalString(body.company, 'company', 160),
      openToCollaborate:
        body.openToCollaborate === undefined
          ? false
          : booleanValue(body.openToCollaborate, 'openToCollaborate'),
      mentoringAvailable:
        body.mentoringAvailable === undefined
          ? false
          : booleanValue(body.mentoringAvailable, 'mentoringAvailable'),
      referralAvailable:
        body.referralAvailable === undefined
          ? false
          : booleanValue(body.referralAvailable, 'referralAvailable'),
    }

    const profile = await prisma.$transaction(async (tx) => {
      await tx.usnClaim.upsert({
        where: { usn },
        create: { usn },
        update: {},
      })
      if (!registration) {
        await tx.connectRegistration.create({
          data: {
            authUserId: user.id,
            email: verifiedEmail,
            usn,
            fullName,
            emailConfirmedAt,
          },
        })
      }
      return tx.memberProfile.create({
        data: {
          ...userFields,
          authUserId: user.id,
          slug: makeSlug(fullName, user.id),
        },
        include: profileInclude,
      })
    })

    return NextResponse.json(
      { success: true, profile },
      { status: 201, headers: { 'Cache-Control': 'private, no-store' } }
    )
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A profile already exists for this account or USN.' },
        { status: 409 }
      )
    }

    const requestError = requestErrorResponse(error)
    if (requestError) return requestError

    console.error('Connect member profile creation failed:', error)
    return NextResponse.json({ error: 'Failed to create the member profile.' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    if (!isSameOriginRequest(req)) {
      return NextResponse.json({ error: 'Forbidden request origin.' }, { status: 403 })
    }

    const user = await getVerifiedMember()
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    const body = await readJsonObject(req)
    const current = await prisma.memberProfile.findUnique({
      where: { authUserId: user.id },
      select: { approvalStatus: true, phone: true, contactEmail: true },
    })
    if (!current) return NextResponse.json({ error: 'Create a profile before editing it.' }, { status: 404 })
    if (current.approvalStatus === 'SUSPENDED') {
      return NextResponse.json({ error: 'This profile cannot be edited while it is restricted.' }, { status: 403 })
    }

    const data: Prisma.MemberProfileUpdateInput = {}

    if (body.fullName !== undefined) {
      throw new ConnectRequestError('The profile name is managed by the official USN roster.')
    }
    if (body.graduationYear !== undefined) {
      data.graduationYear = integerValue(
        body.graduationYear,
        'graduationYear',
        1980,
        new Date().getFullYear() + 8
      )
    }
    if (body.memberType !== undefined) {
      if (body.memberType !== 'STUDENT' && body.memberType !== 'ALUMNUS') {
        throw new ConnectRequestError('memberType must be STUDENT or ALUMNUS.')
      }
      data.memberType = body.memberType
    }

    const stringFields = [
      ['bio', 'bio', 600],
      ['avatarUrl', 'avatarUrl', 2048],
      ['location', 'location', 120],
      ['phone', 'phone', 40],
      ['currentRole', 'currentRole', 160],
      ['company', 'company', 160],
    ] as const

    for (const [inputKey, field, maxLength] of stringFields) {
      if (body[inputKey] === undefined) continue
      const value =
        inputKey === 'avatarUrl' && body[inputKey] !== null && body[inputKey] !== ''
          ? validatedHttpUrl(body[inputKey], field)
          : optionalString(body[inputKey], field, maxLength)
      if (inputKey === 'bio') data.bio = value
      else if (inputKey === 'avatarUrl') data.avatarUrl = value
      else if (inputKey === 'location') data.location = value
      else if (inputKey === 'phone') data.phone = value
      else if (inputKey === 'currentRole') data.currentRole = value
      else data.company = value
    }
    if (body.contactEmail !== undefined) {
      data.contactEmail = optionalEmail(body.contactEmail, 'contactEmail')
    }

    const arrayFields = [
      ['skills', 30, 60],
      ['interests', 30, 60],
      ['skillsInDevelopment', 30, 60],
    ] as const
    for (const [field, maxItems, maxLength] of arrayFields) {
      if (body[field] === undefined) continue
      const value = stringArray(body[field], field, maxItems, maxLength)
      if (field === 'skills') data.skills = value
      else if (field === 'interests') data.interests = value
      else data.skillsInDevelopment = value
    }

    const booleanFields = [
      'phonePublic',
      'contactEmailPublic',
      'openToCollaborate',
      'mentoringAvailable',
      'referralAvailable',
    ] as const
    for (const field of booleanFields) {
      if (body[field] === undefined) continue
      const value = booleanValue(body[field], field)
      if (field === 'phonePublic') data.phonePublic = value
      else if (field === 'contactEmailPublic') data.contactEmailPublic = value
      else if (field === 'openToCollaborate') data.openToCollaborate = value
      else if (field === 'mentoringAvailable') data.mentoringAvailable = value
      else data.referralAvailable = value
    }

    if (body.socialLinks !== undefined) {
      if (!Array.isArray(body.socialLinks) || body.socialLinks.length > 20) {
        throw new ConnectRequestError('socialLinks must contain no more than 20 items.')
      }
      data.socialLinks = {
        deleteMany: {},
        create: body.socialLinks.map((item, index) => {
          if (!isRecord(item)) throw new ConnectRequestError(`socialLinks[${index}] must be an object.`)
          return {
            label: requiredString(item.label, `socialLinks[${index}].label`, 60),
            url: validatedHttpUrl(item.url, `socialLinks[${index}].url`),
            sortOrder: index,
          }
        }),
      }
    }

    if (body.experiences !== undefined) {
      if (!Array.isArray(body.experiences) || body.experiences.length > 30) {
        throw new ConnectRequestError('experiences must contain no more than 30 items.')
      }
      data.experiences = {
        deleteMany: {},
        create: body.experiences.map((item, index) => {
          if (!isRecord(item)) throw new ConnectRequestError(`experiences[${index}] must be an object.`)
          const type = item.type ?? 'EMPLOYMENT'
          if (!['EMPLOYMENT', 'INTERNSHIP', 'HIGHER_STUDIES', 'FREELANCE', 'OTHER'].includes(String(type))) {
            throw new ConnectRequestError(`experiences[${index}].type is invalid.`)
          }
          const startedAt = optionalDate(item.startedAt, `experiences[${index}].startedAt`)
          const endedAt = optionalDate(item.endedAt, `experiences[${index}].endedAt`)
          const isCurrent =
            item.isCurrent === undefined
              ? false
              : booleanValue(item.isCurrent, `experiences[${index}].isCurrent`)
          if (isCurrent && endedAt) {
            throw new ConnectRequestError(`experiences[${index}] cannot have an end date when isCurrent is true.`)
          }
          if (startedAt && endedAt && endedAt < startedAt) {
            throw new ConnectRequestError(`experiences[${index}].endedAt must not be before startedAt.`)
          }
          return {
            type: type as 'EMPLOYMENT' | 'INTERNSHIP' | 'HIGHER_STUDIES' | 'FREELANCE' | 'OTHER',
            role: requiredString(item.role, `experiences[${index}].role`, 160),
            organization: optionalString(item.organization, `experiences[${index}].organization`, 180),
            description: optionalString(item.description, `experiences[${index}].description`, 5000),
            startedAt,
            endedAt,
            isCurrent,
            sortOrder: index,
          }
        }),
      }
    }

    if (body.achievements !== undefined) {
      if (!Array.isArray(body.achievements) || body.achievements.length > 30) {
        throw new ConnectRequestError('achievements must contain no more than 30 items.')
      }
      data.achievements = {
        deleteMany: {},
        create: body.achievements.map((item, index) => {
          if (!isRecord(item)) throw new ConnectRequestError(`achievements[${index}] must be an object.`)
          return {
            title: requiredString(item.title, `achievements[${index}].title`, 180),
            description: optionalString(item.description, `achievements[${index}].description`, 5000),
            achievedAt: optionalDate(item.achievedAt, `achievements[${index}].achievedAt`),
            url:
              item.url === undefined || item.url === null || item.url === ''
                ? null
                : validatedHttpUrl(item.url, `achievements[${index}].url`),
            sortOrder: index,
          }
        }),
      }
    }

    if (body.visibility !== undefined) {
      if (body.visibility !== 'PUBLIC' && body.visibility !== 'PRIVATE') {
        throw new ConnectRequestError('visibility must be PUBLIC or PRIVATE.')
      }
      data.visibility = body.visibility
    }
    if (
      body.phonePublic === true &&
      !(body.phone !== undefined ? data.phone : current.phone)
    ) {
      throw new ConnectRequestError('A phone number is required to make it public.')
    }
    if (
      body.contactEmailPublic === true &&
      !(body.contactEmail !== undefined ? data.contactEmail : current.contactEmail ?? user.email)
    ) {
      throw new ConnectRequestError('A contact email is required to make it public.')
    }
    if (body.contactEmailPublic === true && body.contactEmail === undefined && !current.contactEmail && user.email) {
      data.contactEmail = user.email
    }
    const profile = await prisma.memberProfile.update({
      where: { authUserId: user.id },
      data,
      include: profileInclude,
    })

    return NextResponse.json(
      { success: true, profile },
      { headers: { 'Cache-Control': 'private, no-store' } }
    )
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Profile items cannot contain duplicate unique values.' },
        { status: 409 }
      )
    }
    const requestError = requestErrorResponse(error)
    if (requestError) return requestError

    console.error('Connect member profile update failed:', error)
    return NextResponse.json({ error: 'Failed to update the member profile.' }, { status: 500 })
  }
}
