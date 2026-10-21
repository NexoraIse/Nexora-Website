import { NextResponse } from 'next/server'
import { getAuthenticatedAdmin } from '@/lib/admin-auth'
import { v2 as cloudinary } from 'cloudinary'
import { supabase } from '@/lib/supabase'
import fs from 'node:fs/promises'
import path from 'node:path'

export async function POST(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const bucket = (formData.get('bucket') as string) || 'gallery'

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    // Sanitize filename and create unique path
    const sanitizedBase = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.[^/.]+$/, '')
    const extension = file.name.split('.').pop() || 'jpg'
    const fileName = `${Date.now()}-${sanitizedBase}.${extension}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 1. Try Cloudinary Upload First
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env
    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
      try {
        cloudinary.config({
          cloud_name: CLOUDINARY_CLOUD_NAME,
          api_key: CLOUDINARY_API_KEY,
          api_secret: CLOUDINARY_API_SECRET,
          secure: true,
        })

        const uploaded = await new Promise<{ secure_url: string; public_id: string }>(
          (resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: `nexora/${bucket}`,
                public_id: `${Date.now()}-${sanitizedBase}`,
                resource_type: 'image',
              },
              (error, result) => {
                if (error) return reject(error)
                if (!result?.secure_url) {
                  return reject(new Error('Cloudinary returned no secure image URL.'))
                }
                resolve({ secure_url: result.secure_url, public_id: result.public_id })
              }
            )
            stream.end(buffer)
          }
        )

        return NextResponse.json({
          success: true,
          url: uploaded.secure_url,
          fileName,
          storage: 'cloudinary',
        })
      } catch (cloudinaryError: any) {
        console.warn('Cloudinary upload failed, attempting fallback storage:', cloudinaryError?.message || cloudinaryError)
      }
    }

    // 2. Fallback to Supabase Storage if configured
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, buffer, {
          contentType: file.type || 'application/octet-stream',
          upsert: true,
        })

      if (!error && data?.path) {
        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(data.path)
        return NextResponse.json({
          success: true,
          url: publicData.publicUrl,
          fileName,
          storage: 'supabase',
        })
      }
    } catch (supabaseError: any) {
      console.warn('Supabase storage fallback error:', supabaseError?.message)
    }

    // 3. Fallback to local public uploads folder if remote storage is offline
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', bucket)
      await fs.mkdir(uploadDir, { recursive: true })
      const filePath = path.join(uploadDir, fileName)
      await fs.writeFile(filePath, buffer)

      const localUrl = `/uploads/${bucket}/${fileName}`
      return NextResponse.json({
        success: true,
        url: localUrl,
        fileName,
        storage: 'local',
        note: 'Saved locally as Cloudinary credentials are not configured in environment.',
      })
    } catch (localError: any) {
      console.error('Local file write error:', localError)
    }

    return NextResponse.json(
      { error: 'Failed to upload image. Please check Cloudinary credentials.' },
      { status: 500 }
    )
  } catch (err: unknown) {
    console.error('File upload error:', err)
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 })
  }
}
