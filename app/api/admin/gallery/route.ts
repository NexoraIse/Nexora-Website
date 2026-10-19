import { NextResponse } from 'next/server'
import { getAuthenticatedAdmin } from '@/lib/admin-auth'
import {
  getAllGalleryItems,
  saveCustomGalleryItem,
  deleteCustomGalleryItem,
} from '@/lib/gallery-store'

export async function GET(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const items = await getAllGalleryItems()
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env
    const isCloudinaryConfigured = Boolean(
      CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET
    )

    return NextResponse.json({
      items,
      isCloudinaryConfigured,
      cloudinaryCloudName: CLOUDINARY_CLOUD_NAME || null,
    })
  } catch (error: any) {
    console.error('Admin gallery fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch gallery items.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const body = await req.json()
    const { title, caption, category, date, location, src, alt, aspectRatio } = body

    if (!title || !src) {
      return NextResponse.json({ error: 'Title and Image URL are required.' }, { status: 400 })
    }

    const newItem = await saveCustomGalleryItem({
      title,
      caption: caption || '',
      category: category || 'Workshop',
      date: date || '2026',
      location: location || '',
      src,
      alt: alt || title,
      aspectRatio: aspectRatio || 'aspect-[16/9]',
      width: 800,
      height: 450,
    })

    return NextResponse.json({
      success: true,
      item: newItem,
      message: 'Photo added to gallery successfully.',
    })
  } catch (error: any) {
    console.error('Admin gallery creation error:', error)
    return NextResponse.json({ error: 'Failed to save gallery item.' }, { status: 500 })
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
      return NextResponse.json({ error: 'ID is required.' }, { status: 400 })
    }

    const deleted = await deleteCustomGalleryItem(id)
    if (!deleted) {
      return NextResponse.json(
        { error: 'Cannot delete default seeded gallery items, or item not found.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, message: 'Photo removed from gallery.' })
  } catch (error: any) {
    console.error('Admin gallery delete error:', error)
    return NextResponse.json({ error: 'Failed to delete gallery item.' }, { status: 500 })
  }
}

