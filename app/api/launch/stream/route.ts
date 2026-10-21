import { connection } from 'next/server'
import { getPublicLaunchState } from '@/lib/launch/state'

export async function GET(request: Request) {
  await connection()
  const encoder = new TextEncoder()
  let closed = false
  let interval: ReturnType<typeof setInterval> | null = null
  let heartbeat: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const cleanup = () => {
        if (closed) return
        closed = true
        if (interval) clearInterval(interval)
        if (heartbeat) clearInterval(heartbeat)
        try {
          controller.close()
        } catch {
          // ignore if already closed
        }
      }

      const write = (event: string, payload: unknown) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`event: ${event}\n`))
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
        } catch {
          cleanup()
        }
      }

      heartbeat = setInterval(() => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(': ping\n\n'))
        } catch {
          cleanup()
        }
      }, 15_000)

      const poll = async () => {
        if (closed) return
        try {
          const state = await getPublicLaunchState()
          write('state', state)
        } catch (err) {
          console.error('Launch SSE poll failed:', err)
          write('error', { message: 'stream_poll_failed' })
        }
      }

      await poll()
      interval = setInterval(() => {
        void poll()
      }, 2_000)

      const abortSignal = request.signal
      abortSignal.addEventListener('abort', cleanup)
    },
    cancel() {
      if (interval) clearInterval(interval)
      if (heartbeat) clearInterval(heartbeat)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
