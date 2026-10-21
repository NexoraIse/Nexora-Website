import { randomUUID } from 'node:crypto'
import { v2 as cloudinary } from 'cloudinary'
import { NextResponse } from 'next/server'
import { getVerifiedMember, isSameOriginRequest } from '@/lib/connect/auth'

const MAX_AVATAR_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function isSupportedImage(bytes: Buffer, contentType: string) {
  if (contentType === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  }
  if (contentType === 'image/png') {
    return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  }
  return contentType === 'image/webp'
    && bytes.toString('ascii', 0, 4) === 'RIFF'
    && bytes.toString('ascii', 8, 12) === 'WEBP'
}

export async function POST(req: Request) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: 'Forbidden request origin.' }, { status: 403 })
  }

  const user = await getVerifiedMember()
  if (!user) return NextResponse.json({ error: 'Sign in to upload a profile photo.' }, { status: 401 })

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error('Connect profile photo upload is unavailable: Cloudinary credentials are not configured.')
    return NextResponse.json(
      { error: 'Photo uploads are not set up yet. Please try again later.' },
      { status: 503 }
    )
  }

  try {
    const contentLength = Number(req.headers.get('content-length'))
    if (Number.isFinite(contentLength) && contentLength > MAX_AVATAR_BYTES + 64 * 1024) {
      return NextResponse.json({ error: 'Photos must be smaller than 5 MB.' }, { status: 413 })
    }

    const formData = await req.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Choose a photo to upload.' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Choose a JPG, PNG, or WebP image.' }, { status: 415 })
    }
    if (file.size === 0 || file.size > MAX_AVATAR_BYTES) {
      return NextResponse.json({ error: 'Photos must be smaller than 5 MB.' }, { status: 413 })
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    if (!isSupportedImage(bytes, file.type)) {
      return NextResponse.json({ error: 'This file is not a valid JPG, PNG, or WebP image.' }, { status: 415 })
    }

    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    })

    const uploaded = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `nexora/connect-profiles/${user.id}`,
          public_id: randomUUID(),
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          transformation: [{ width: 800, height: 800, crop: 'fill', gravity: 'auto', quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error) {
            reject(error)
            return
          }
          if (!result?.secure_url) {
            reject(new Error('Cloudinary returned no secure image URL.'))
            return
          }
          resolve({ secure_url: result.secure_url })
        }
      )
      stream.end(bytes)
    })

    return NextResponse.json(
      { success: true, url: uploaded.secure_url },
      { headers: { 'Cache-Control': 'private, no-store' } }
    )
  } catch (error) {
    console.error('Connect profile photo upload failed:', error)
    return NextResponse.json(
      { error: 'We could not upload that photo. Please try again.' },
      { status: 500 }
    )
  }
}
