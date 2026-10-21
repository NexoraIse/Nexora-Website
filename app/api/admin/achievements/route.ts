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
        { studentOrTeamName: { contains: search, mode: 'insensitive' } },
        { competitionOrEvent: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (category) {
      where.category = category
    }
    if (status) {
      where.status = status
    }

    const achievements = await prisma.achievement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
      },
    })

    return NextResponse.json({ achievements })
  } catch (err: unknown) {
    console.error('Fetch achievements error:', err)
    return NextResponse.json({ error: 'Failed to fetch achievements.' }, { status: 500 })
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
      studentOrTeamName,
      competitionOrEvent,
      awardOrPosition,
      achievementDate,
      dateDisplay,
      image,
      externalUrl,
      status = 'PUBLISHED',
    } = body

    if (!title || !description || !category) {
      return NextResponse.json(
        { error: 'Title, category, and description are required.' },
        { status: 400 }
      )
    }

    let baseSlug = generateSlug(title)
    if (!baseSlug) baseSlug = `achievement-${Date.now()}`
    let slug = baseSlug
    let counter = 1
    while (await prisma.achievement.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const achievement = await prisma.achievement.create({
      data: {
        title: title.trim(),
        slug,
        category: category.trim(),
        description: description.trim(),
        studentOrTeamName: studentOrTeamName?.trim() || null,
        competitionOrEvent: competitionOrEvent?.trim() || null,
        awardOrPosition: awardOrPosition?.trim() || null,
        achievementDate: achievementDate ? new Date(achievementDate) : null,
        dateDisplay: dateDisplay?.trim() || null,
        image: image || null,
        externalUrl: externalUrl?.trim() || null,
        status: status as any,
        createdById: admin.id,
      },
    })

    await recordAuditLog({
      action: 'CREATE',
      entity: 'Achievement',
      entityId: achievement.id,
      details: `Created achievement "${achievement.title}"`,
      adminId: admin.id,
    })

    return NextResponse.json({ success: true, achievement })
  } catch (err: unknown) {
    console.error('Create achievement error:', err)
    return NextResponse.json({ error: 'Failed to create achievement.' }, { status: 500 })
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
      return NextResponse.json({ error: 'Achievement ID is required.' }, { status: 400 })
    }

    const existing = await prisma.achievement.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Achievement not found.' }, { status: 404 })
    }

    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title.trim()
    if (data.category !== undefined) updateData.category = data.category.trim()
    if (data.description !== undefined) updateData.description = data.description.trim()
    if (data.studentOrTeamName !== undefined) updateData.studentOrTeamName = data.studentOrTeamName?.trim() || null
    if (data.competitionOrEvent !== undefined) updateData.competitionOrEvent = data.competitionOrEvent?.trim() || null
    if (data.awardOrPosition !== undefined) updateData.awardOrPosition = data.awardOrPosition?.trim() || null
    if (data.achievementDate !== undefined) {
      updateData.achievementDate = data.achievementDate ? new Date(data.achievementDate) : null
    }
    if (data.dateDisplay !== undefined) updateData.dateDisplay = data.dateDisplay?.trim() || null
    if (data.image !== undefined) updateData.image = data.image || null
    if (data.externalUrl !== undefined) updateData.externalUrl = data.externalUrl?.trim() || null
    if (data.status !== undefined) updateData.status = data.status

    const updated = await prisma.achievement.update({
      where: { id },
      data: updateData,
    })

    await recordAuditLog({
      action: 'UPDATE',
      entity: 'Achievement',
      entityId: id,
      details: `Updated achievement "${updated.title}"`,
      adminId: admin.id,
    })

    return NextResponse.json({ success: true, achievement: updated })
  } catch (err: unknown) {
    console.error('Update achievement error:', err)
    return NextResponse.json({ error: 'Failed to update achievement.' }, { status: 500 })
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
      return NextResponse.json({ error: 'Achievement ID is required.' }, { status: 400 })
    }

    const existing = await prisma.achievement.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Achievement not found.' }, { status: 404 })
    }

    await prisma.achievement.delete({ where: { id } })

    await recordAuditLog({
      action: 'DELETE',
      entity: 'Achievement',
      entityId: id,
      details: `Deleted achievement "${existing.title}"`,
      adminId: admin.id,
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Delete achievement error:', err)
    return NextResponse.json({ error: 'Failed to delete achievement.' }, { status: 500 })
  }
}
