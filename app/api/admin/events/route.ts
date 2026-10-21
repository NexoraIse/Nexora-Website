import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedAdmin, recordAuditLog } from '@/lib/admin-auth'

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function GET(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim() || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''

    const where: any = {}
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { venue: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (category) {
      where.category = category
    }
    if (status) {
      where.status = status
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
      },
    })

    return NextResponse.json({ events })
  } catch (err: unknown) {
    console.error('Fetch events error:', err)
    return NextResponse.json({ error: 'Failed to fetch events.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const body = await req.json()
    const {
      title,
      category,
      description,
      fullDescription,
      imageUrl,
      iconName,
      startDate,
      endDate,
      dateDisplay,
      venue,
      venueDisplay,
      status,
      registrationOpen,
      registrationUrl,
      registrationDeadline,
      eligibility,
      organizer,
      tags,
    } = body

    if (!title || !category || !description) {
      return NextResponse.json(
        { error: 'Title, category, and description are required.' },
        { status: 400 }
      )
    }

    let slug = body.slug ? generateSlug(body.slug) : generateSlug(title)
    // Ensure slug uniqueness
    const existing = await prisma.event.findUnique({ where: { slug } })
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`
    }

    const event = await prisma.event.create({
      data: {
        title,
        slug,
        category,
        description,
        fullDescription,
        imageUrl,
        iconName: iconName || 'Code',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        dateDisplay: dateDisplay || 'To be announced (TBA)',
        venue: venue || null,
        venueDisplay: venueDisplay || venue || 'Campus Tech Hub (TBA)',
        status: status || 'PUBLISHED',
        registrationOpen: registrationOpen ?? true,
        registrationUrl: registrationUrl || null,
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
        eligibility: eligibility || 'Open to all ISE students.',
        organizer: organizer || 'Nexora ISE Technical Committee',
        tags: Array.isArray(tags) ? tags : [],
        createdById: admin.id,
      },
    })

    await recordAuditLog({
      action: 'CREATE',
      entity: 'Event',
      entityId: event.id,
      details: `Created event "${event.title}" (${event.status})`,
      adminId: admin.id,
    })

    return NextResponse.json({ success: true, event })
  } catch (err: unknown) {
    console.error('Create event error:', err)
    return NextResponse.json({ error: 'Failed to create event.' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const body = await req.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required.' }, { status: 400 })
    }

    const updateData: any = {}
    if (data.title) updateData.title = data.title
    if (data.category) updateData.category = data.category
    if (data.description) updateData.description = data.description
    if (data.fullDescription !== undefined) updateData.fullDescription = data.fullDescription
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
    if (data.iconName !== undefined) updateData.iconName = data.iconName
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null
    if (data.dateDisplay !== undefined) updateData.dateDisplay = data.dateDisplay
    if (data.venue !== undefined) updateData.venue = data.venue
    if (data.venueDisplay !== undefined) updateData.venueDisplay = data.venueDisplay
    if (data.status) updateData.status = data.status
    if (data.registrationOpen !== undefined) updateData.registrationOpen = data.registrationOpen
    if (data.registrationUrl !== undefined) updateData.registrationUrl = data.registrationUrl
    if (data.registrationDeadline !== undefined) updateData.registrationDeadline = data.registrationDeadline ? new Date(data.registrationDeadline) : null
    if (data.eligibility !== undefined) updateData.eligibility = data.eligibility
    if (data.organizer !== undefined) updateData.organizer = data.organizer
    if (Array.isArray(data.tags)) updateData.tags = data.tags

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
    })

    await recordAuditLog({
      action: 'UPDATE',
      entity: 'Event',
      entityId: event.id,
      details: `Updated event "${event.title}"`,
      adminId: admin.id,
    })

    return NextResponse.json({ success: true, event })
  } catch (err: unknown) {
    console.error('Update event error:', err)
    return NextResponse.json({ error: 'Failed to update event.' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Event ID required.' }, { status: 400 })
    }

    const event = await prisma.event.delete({
      where: { id },
    })

    await recordAuditLog({
      action: 'DELETE',
      entity: 'Event',
      entityId: id,
      details: `Deleted event "${event.title}"`,
      adminId: admin.id,
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Delete event error:', err)
    return NextResponse.json({ error: 'Failed to delete event.' }, { status: 500 })
  }
}
