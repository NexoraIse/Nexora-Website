import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { publicMemberProfileSelect, toPublicMemberProfile } from '@/lib/connect/public-profile'

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const profile = await prisma.memberProfile.findFirst({
      where: {
        slug,
        approvalStatus: { not: 'SUSPENDED' },
        visibility: 'PUBLIC',
      },
      select: publicMemberProfileSelect,
    })

    if (!profile) {
      return NextResponse.json({ error: 'Member profile not found.' }, { status: 404 })
    }

    return NextResponse.json(
      { profile: toPublicMemberProfile(profile) },
      { headers: { 'Cache-Control': 'private, no-store' } }
    )
  } catch (error) {
    console.error('Connect public profile fetch failed:', error)
    return NextResponse.json({ error: 'Failed to load the member profile.' }, { status: 500 })
  }
}
