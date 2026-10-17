import { Prisma } from '@/generated/prisma/client'

export const publicMemberProfileSelect = {
  slug: true,
  fullName: true,
  graduationYear: true,
  memberType: true,
  bio: true,
  avatarUrl: true,
  skills: true,
  interests: true,
  skillsInDevelopment: true,
  location: true,
  contactEmail: true,
  contactEmailPublic: true,
  currentRole: true,
  company: true,
  openToCollaborate: true,
  mentoringAvailable: true,
  referralAvailable: true,
  socialLinks: {
    select: { id: true, label: true, url: true, sortOrder: true },
    orderBy: { sortOrder: 'asc' },
  },
  experiences: {
    select: {
      id: true,
      type: true,
      role: true,
      organization: true,
      description: true,
      startedAt: true,
      endedAt: true,
      isCurrent: true,
      sortOrder: true,
    },
    orderBy: { sortOrder: 'asc' },
  },
  achievements: {
    select: {
      id: true,
      title: true,
      description: true,
      achievedAt: true,
      url: true,
      sortOrder: true,
    },
    orderBy: { sortOrder: 'asc' },
  },
  knowledgePage: { select: { publishedMarkdown: true, publishedAt: true } },
} satisfies Prisma.MemberProfileSelect

type PublicMemberProfile = Prisma.MemberProfileGetPayload<{
  select: typeof publicMemberProfileSelect
}>

export function toPublicMemberProfile(profile: PublicMemberProfile) {
  return {
    ...profile,
    contactEmail: profile.contactEmailPublic ? profile.contactEmail : null,
    contactEmailPublic: undefined,
  }
}
