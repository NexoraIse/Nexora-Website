import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedMember, getVerifiedMember, isSameOriginRequest } from '@/lib/connect/auth'
import {
  booleanValue,
  ConnectRequestError,
  readJsonObject,
  requestErrorResponse,
} from '@/lib/connect/validation'

function validateMarkdown(value: unknown): string {
  if (typeof value !== 'string') {
    throw new ConnectRequestError('markdown must be a string.')
  }
  const markdown = value.replace(/\r\n?/g, '\n').trim()
  if (markdown.length > 50_000) {
    throw new ConnectRequestError('markdown cannot exceed 50,000 characters.')
  }
  if (/<\/?[a-z][^>]*>|<!--/i.test(markdown)) {
    throw new ConnectRequestError('Raw HTML is not allowed in Markdown.')
  }
  if (/(?:javascript|vbscript|data)\s*:/i.test(markdown)) {
    throw new ConnectRequestError('Unsafe URL schemes are not allowed in Markdown.')
  }
  return markdown
}

export async function GET() {
  try {
    const user = await getAuthenticatedMember()
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    const page = await prisma.memberKnowledgePage.findUnique({
      where: { profileId: user.id },
      select: {
        draftMarkdown: true,
        publishedMarkdown: true,
        draftUpdatedAt: true,
        publishedAt: true,
        updatedAt: true,
      },
    })
    return NextResponse.json(
      { page },
      { headers: { 'Cache-Control': 'private, no-store' } }
    )
  } catch (error) {
    console.error('Connect knowledge page fetch failed:', error)
    return NextResponse.json({ error: 'Failed to load the knowledge page.' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    if (!isSameOriginRequest(req)) {
      return NextResponse.json({ error: 'Forbidden request origin.' }, { status: 403 })
    }
    const user = await getVerifiedMember()
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    const body = await readJsonObject(req, 64 * 1024)
    const draftMarkdown = validateMarkdown(body.markdown)
    const publish = booleanValue(body.publish, 'publish')

    const profile = await prisma.memberProfile.findUnique({
      where: { authUserId: user.id },
      select: { approvalStatus: true },
    })
    if (!profile) return NextResponse.json({ error: 'Create a profile before editing a knowledge page.' }, { status: 404 })
    if (profile.approvalStatus === 'SUSPENDED') {
      return NextResponse.json({ error: 'This profile cannot publish a knowledge page while it is restricted.' }, { status: 403 })
    }
    if (publish && !draftMarkdown) {
      throw new ConnectRequestError('Cannot publish an empty knowledge page.')
    }

    const now = new Date()
    const page = await prisma.memberKnowledgePage.upsert({
      where: { profileId: user.id },
      create: {
        profileId: user.id,
        draftMarkdown,
        draftUpdatedAt: now,
        ...(publish ? { publishedMarkdown: draftMarkdown, publishedAt: now } : {}),
      },
      update: {
        draftMarkdown,
        draftUpdatedAt: now,
        ...(publish ? { publishedMarkdown: draftMarkdown, publishedAt: now } : {}),
      },
      select: {
        draftMarkdown: true,
        publishedMarkdown: true,
        draftUpdatedAt: true,
        publishedAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(
      { success: true, page },
      { headers: { 'Cache-Control': 'private, no-store' } }
    )
  } catch (error) {
    const requestError = requestErrorResponse(error)
    if (requestError) return requestError
    console.error('Connect knowledge page update failed:', error)
    return NextResponse.json({ error: 'Failed to update the knowledge page.' }, { status: 500 })
  }
}
