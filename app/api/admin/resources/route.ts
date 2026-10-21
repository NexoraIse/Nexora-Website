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
    const subject = searchParams.get('subject') || ''
    const semesterStr = searchParams.get('semester') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''

    const where: any = {}
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (subject) {
      where.subject = subject
    }
    if (semesterStr) {
      const sem = parseInt(semesterStr, 10)
      if (!isNaN(sem)) where.semester = sem
    }
    if (category) {
      where.category = category
    }
    if (status) {
      where.status = status
    }

    const resources = await prisma.learningResource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
      },
    })

    return NextResponse.json({ resources })
  } catch (err: unknown) {
    console.error('Fetch resources error:', err)
    return NextResponse.json({ error: 'Failed to fetch learning resources.' }, { status: 500 })
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
      description,
      subject,
      semester,
      academicYear,
      category = 'notes',
      resourceType = 'PDF',
      fileUrl,
      thumbnailUrl,
      tags = [],
      status = 'PUBLISHED',
    } = body

    if (!title || !description || !subject) {
      return NextResponse.json(
        { error: 'Title, description, and subject are required.' },
        { status: 400 }
      )
    }

    let baseSlug = generateSlug(title)
    if (!baseSlug) baseSlug = `resource-${Date.now()}`
    let slug = baseSlug
    let counter = 1
    while (await prisma.learningResource.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const resource = await prisma.learningResource.create({
      data: {
        title: title.trim(),
        slug,
        description: description.trim(),
        subject: subject.trim(),
        semester: semester ? Number(semester) : null,
        academicYear: academicYear?.trim() || null,
        category: category.trim(),
        resourceType: resourceType.trim(),
        fileUrl: fileUrl?.trim() || null,
        thumbnailUrl: thumbnailUrl?.trim() || null,
        tags: Array.isArray(tags) ? tags : [],
        status: status as any,
        createdById: admin.id,
      },
    })

    await recordAuditLog({
      action: 'CREATE',
      entity: 'LearningResource',
      entityId: resource.id,
      details: `Created learning resource "${resource.title}"`,
      adminId: admin.id,
    })

    return NextResponse.json({ success: true, resource })
  } catch (err: unknown) {
    console.error('Create resource error:', err)
    return NextResponse.json({ error: 'Failed to create learning resource.' }, { status: 500 })
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
      return NextResponse.json({ error: 'Resource ID is required.' }, { status: 400 })
    }

    const existing = await prisma.learningResource.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Learning resource not found.' }, { status: 404 })
    }

    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title.trim()
    if (data.description !== undefined) updateData.description = data.description.trim()
    if (data.subject !== undefined) updateData.subject = data.subject.trim()
    if (data.semester !== undefined) updateData.semester = data.semester ? Number(data.semester) : null
    if (data.academicYear !== undefined) updateData.academicYear = data.academicYear?.trim() || null
    if (data.category !== undefined) updateData.category = data.category.trim()
    if (data.resourceType !== undefined) updateData.resourceType = data.resourceType.trim()
    if (data.fileUrl !== undefined) updateData.fileUrl = data.fileUrl?.trim() || null
    if (data.thumbnailUrl !== undefined) updateData.thumbnailUrl = data.thumbnailUrl?.trim() || null
    if (data.tags !== undefined) updateData.tags = Array.isArray(data.tags) ? data.tags : []
    if (data.status !== undefined) updateData.status = data.status

    const updated = await prisma.learningResource.update({
      where: { id },
      data: updateData,
    })

    await recordAuditLog({
      action: 'UPDATE',
      entity: 'LearningResource',
      entityId: id,
      details: `Updated learning resource "${updated.title}"`,
      adminId: admin.id,
    })

    return NextResponse.json({ success: true, resource: updated })
  } catch (err: unknown) {
    console.error('Update resource error:', err)
    return NextResponse.json({ error: 'Failed to update learning resource.' }, { status: 500 })
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
      return NextResponse.json({ error: 'Resource ID is required.' }, { status: 400 })
    }

    const existing = await prisma.learningResource.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Learning resource not found.' }, { status: 404 })
    }

    await prisma.learningResource.delete({ where: { id } })

    await recordAuditLog({
      action: 'DELETE',
      entity: 'LearningResource',
      entityId: id,
      details: `Deleted learning resource "${existing.title}"`,
      adminId: admin.id,
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Delete resource error:', err)
    return NextResponse.json({ error: 'Failed to delete learning resource.' }, { status: 500 })
  }
}
