import { NextResponse } from 'next/server'
import { getAllGalleryRows, getAllGalleryItems } from '@/lib/gallery-store'

export async function GET() {
  try {
    const rows = await getAllGalleryRows()
    const all = await getAllGalleryItems()

    return NextResponse.json(
      { rows, all },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    )
  } catch (error: any) {
    console.error('Public gallery fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch gallery.' }, { status: 500 })
  }
}

