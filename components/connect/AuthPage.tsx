'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react'
import { ConnectShell } from './ConnectShell'
import { Feedback, Panel, PageHeading } from './ConnectUI'

type AuthMode = 'auth' | 'start'

function AuthAside() {
  return (
    <aside className="connect-auth-aside">
      <div className="connect-auth-orbit" aria-hidden>
        <span className="connect-orbit orbit-one" />
        <span className="connect-orbit orbit-two" />
        <span className="connect-orbit-core"><Sparkles size={24} /></span>
      </div>
      <p className="connect-eyebrow">Nexora · Connect</p>
      <p className="mt-5 whitespace-pre-line font-clash text-[clamp(2.3rem,4vw,3.8rem)] font-medium leading-[1.02] tracking-[-0.05em] text-white">Your people,{'\n'}your next chapter.</p>
      <p className="mt-5 max-w-sm text-sm leading-6 text-[#9caeba]">A welcoming place for the ISE community to share what they build and find people to build with.</p>
      <div className="mt-12 flex items-center gap-3 border-t border-white/10 pt-5">
        <span className="font-mono text-[10px] tracking-[0.18em] text-[#77d9f3]">01</span>
        <span className="h-px w-9 bg-[#77d9f3]/50" />
        <span className="text-[11px] text-[#80919f]">A verified community. Built around you.</span>
      </div>
    </aside>
  )
}

export default function AuthPage({ mode }: { mode: AuthMode }) {
  const router = useRouter()
  const [sessionResolved, setSessionResolved] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string } | null>(null)

  useEffect(() => {
    const authError = new URLSearchParams(window.location.search).get('authError')
    if (authError !== 'google_auth_failed') return

    const timer = window.setTimeout(() => {
      setFeedback({
        message: 'Google sign-in could not be completed. Please try again.',
      })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [mode])

  useEffect(() => {
    let active = true
    void fetch('/api/connect/auth/session', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Unable to check your Connect session.')
        if (!active) return
        if (data.authenticated) {
          router.replace('/connect/dashboard')
          return
        }
        if (mode === 'start') {
          router.replace('/connect/sign-in')
          return
        }
        setSessionResolved(true)
      })
      .catch((error: unknown) => {
        if (!active) return
        setFeedback({
          message: error instanceof Error ? error.message : 'We could not check your session. Please try signing in.',
        })
        setSessionResolved(true)
      })
    return () => { active = false }
  }, [mode, router])

  if (mode === 'start') {
    return (
      <ConnectShell>
        <div className="mx-auto max-w-[1440px] px-5 py-24 sm:px-8">
          <Panel className="mx-auto max-w-lg p-8 text-center">
            <span className="connect-empty-icon"><ShieldCheck size={22} /></span>
            <p className="connect-eyebrow mt-5">One moment</p>
            <h1 className="mt-2 font-clash text-3xl text-white">Opening your Connect space</h1>
            <p className="mt-3 text-sm text-[#aab6c2]">Just a moment while we get things ready…</p>
            {feedback && <Feedback message={feedback.message} kind="error" />}
          </Panel>
        </div>
      </ConnectShell>
    )
  }

  return (
    <ConnectShell>
      <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 lg:px-12 lg:py-16">
        <div className="hidden lg:block"><AuthAside /></div>
        <div className="mx-auto w-full max-w-[540px] lg:mx-0 lg:ml-auto">
          <Link href="/connect" className="connect-back-link"><ArrowLeft size={14} /> Back to the community</Link>
          <PageHeading
            eyebrow="Nexora Connect"
            title="Connect with your community."
            description="Continue with Google. New members can set up a profile; returning members will go straight to their Connect space."
          />
          <Panel className="p-5 sm:p-8">
            {mode === 'auth' && !sessionResolved && (
              <p role="status" className="text-center text-sm text-[#aab6c2]">Checking your session…</p>
            )}
            {mode === 'auth' && sessionResolved && (
              <div className="space-y-4">
                <form action="/api/connect/auth/google" method="get">
                  <button
                    type="submit"
                    className="flex h-10 w-full items-center justify-center gap-3 rounded border border-[#747775] bg-white px-4 text-sm font-medium text-[#1f1f1f] transition-colors hover:bg-[#f8faff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4285f4]"
                  >
                    <svg aria-hidden="true" className="h-[18px] w-[18px] shrink-0" viewBox="0 0 48 48">
                      <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.9 6-15Z" />
                      <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.1c-1.8 1.2-4.1 2-6.8 2-5.3 0-9.8-3.6-11.4-8.4H5.7v5.3A20 20 0 0 0 24 44Z" />
                      <path fill="#FBBC05" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.3H5.7a20 20 0 0 0 0 17.8l6.9-5.3Z" />
                      <path fill="#EA4335" d="M24 11.9c3 0 5.7 1 7.8 3.1l5.8-5.8A19.4 19.4 0 0 0 24 4 20 20 0 0 0 5.7 15.1l6.9 5.3c1.6-4.9 6.1-8.5 11.4-8.5Z" />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </form>
                <p className="text-center text-[11px] leading-5 text-[#81919e]">
                  Use the Google account you want linked to your Nexora Connect profile.
                </p>
                {feedback && <Feedback message={feedback.message} kind="error" />}
              </div>
            )}
          </Panel>
          <p className="mt-5 flex items-center justify-center gap-2 text-center text-[10px] text-[#72828f]">
            <ShieldCheck size={13} /> Your name is checked with the department before your profile is shared.
          </p>
        </div>
      </div>
    </ConnectShell>
  )
}
