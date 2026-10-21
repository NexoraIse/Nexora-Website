import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedAdmin, recordAuditLog } from '@/lib/admin-auth'

export async function GET(req: Request) {
  try {
    const currentAdmin = await getAuthenticatedAdmin(req)
    if (!currentAdmin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ admins })
  } catch (err: unknown) {
    console.error('Fetch admins error:', err)
    return NextResponse.json({ error: 'Failed to fetch admins.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const currentAdmin = await getAuthenticatedAdmin(req)
    if (!currentAdmin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    if (currentAdmin.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only Super Administrators can create admin accounts.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { email, password, name, role = 'ADMIN' } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required.' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
    }

    const existing = await prisma.admin.findUnique({
      where: { email: trimmedEmail },
    })

    if (existing) {
      return NextResponse.json({ error: 'An admin with this email already exists.' }, { status: 400 })
    }

    const hashedPassword = bcrypt.hashSync(password, 10)

    const newAdmin = await prisma.admin.create({
      data: {
        id: crypto.randomUUID(),
        email: trimmedEmail,
        password: hashedPassword,
        name: name?.trim() || null,
        role: role as any,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    await recordAuditLog({
      action: 'CREATE',
      entity: 'Admin',
      entityId: newAdmin.id,
      details: `Created admin user "${newAdmin.email}" with role ${newAdmin.role}`,
      adminId: currentAdmin.id,
    })

    return NextResponse.json({ success: true, admin: newAdmin })
  } catch (err: unknown) {
    console.error('Create admin error:', err)
    return NextResponse.json({ error: 'Failed to create admin.' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const currentAdmin = await getAuthenticatedAdmin(req)
    if (!currentAdmin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    if (currentAdmin.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only Super Administrators can delete admin accounts.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Admin ID is required.' }, { status: 400 })
    }

    if (id === currentAdmin.id) {
      return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 })
    }

    const targetAdmin = await prisma.admin.findUnique({ where: { id } })
    if (!targetAdmin) {
      return NextResponse.json({ error: 'Admin not found.' }, { status: 404 })
    }

    await prisma.admin.delete({ where: { id } })

    await recordAuditLog({
      action: 'DELETE',
      entity: 'Admin',
      entityId: id,
      details: `Deleted admin user "${targetAdmin.email}"`,
      adminId: currentAdmin.id,
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Delete admin error:', err)
    return NextResponse.json({ error: 'Failed to delete admin.' }, { status: 500 })
  }
}
