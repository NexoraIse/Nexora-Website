import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedAdmin, recordAuditLog } from '@/lib/admin-auth'

export async function GET(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')

    const where: any = {}
    if (type) {
      where.type = type
    }

    const categories = await prisma.contentCategory.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ categories })
  } catch (err: unknown) {
    console.error('Fetch categories error:', err)
    return NextResponse.json({ error: 'Failed to fetch categories.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const body = await req.json()
    const { name, type, description } = body

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required.' }, { status: 400 })
    }

    const existing = await prisma.contentCategory.findUnique({
      where: { name: name.trim() },
    })

    if (existing) {
      return NextResponse.json({ error: 'Category with this name already exists.' }, { status: 400 })
    }

    const category = await prisma.contentCategory.create({
      data: {
        name: name.trim(),
        type: type.trim(),
        description: description?.trim() || null,
      },
    })

    await recordAuditLog({
      action: 'CREATE',
      entity: 'Category',
      entityId: category.id,
      details: `Created category "${category.name}" (${category.type})`,
      adminId: admin.id,
    })

    return NextResponse.json({ success: true, category })
  } catch (err: unknown) {
    console.error('Create category error:', err)
    return NextResponse.json({ error: 'Failed to create category.' }, { status: 500 })
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
      return NextResponse.json({ error: 'Category ID is required.' }, { status: 400 })
    }

    const existing = await prisma.contentCategory.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Category not found.' }, { status: 404 })
    }

    await prisma.contentCategory.delete({ where: { id } })

    await recordAuditLog({
      action: 'DELETE',
      entity: 'Category',
      entityId: id,
      details: `Deleted category "${existing.name}"`,
      adminId: admin.id,
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Delete category error:', err)
    return NextResponse.json({ error: 'Failed to delete category.' }, { status: 500 })
  }
}
