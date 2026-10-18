'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BookOpenText, Eye, FileText, Save, Send } from 'lucide-react'
import { Button, Feedback, PageHeading, Panel } from './ConnectUI'
import { ConnectMarkdown } from './ConnectMarkdown'

type KnowledgeData = {
  draftMarkdown: string | null
  publishedMarkdown: string | null
  draftUpdatedAt: string | null
  publishedAt: string | null
}

const STARTER_TEMPLATE = `# **[Your Name]**

> *[A short line that captures what you care about, what you build, or where you are headed.]*

---

## **The story so far**

I am **[your current role, course, or focus]**, interested in **[topics you enjoy]**. My journey so far has included **[an experience, project, or turning point]**.

## **Things I am proud of**

- **[Project, achievement, or milestone]** — [what you did and why it matters to you]
- **[Another highlight]** — [a lesson or moment you will remember]

## **What I have learned**

> **[A lesson, idea, or piece of advice you wish you had heard earlier.]**

Add a little context: what happened, what changed, and what you would suggest to someone facing something similar.

## **How I like to build**

I enjoy **[the kind of problems or projects you like]**. Lately I have been exploring **[a skill, tool, or area you are learning]**.

## **A few things I value**

- **Curiosity:** [what keeps you asking questions]
- **Community:** [how you like to contribute or collaborate]
- **Growth:** [what you are working toward]

## **Currently exploring**

**Next up:** [a goal, idea, or project you are excited to pursue]

## **Find me online**

- [Portfolio](https://example.com)
- [GitHub](https://github.com/your-username)
- [LinkedIn](https://linkedin.com/in/your-profile)

---

*Thanks for stopping by. I am always glad to connect about **[a topic, idea, or shared interest]**.*
`

export function KnowledgeEditor({
  embedded = false,
}: {
  embedded?: boolean
}) {
  const [page, setPage] = useState<KnowledgeData | null>(null)
  const [markdown, setMarkdown] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; kind: 'error' | 'success' | 'info' } | null>(null)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const pageRequest = fetch('/api/connect/me/knowledge', { cache: 'no-store' })
        const sessionRequest = !embedded
          ? fetch('/api/connect/auth/session', { cache: 'no-store' })
          : null
        const [pageResponse, sessionResponse] = await Promise.all([pageRequest, sessionRequest])
        const data = await pageResponse.json()
        const session = sessionResponse ? await sessionResponse.json() : null
        if (!active) return
        if (session && (!session.authenticated || !session.emailVerified)) {
          setFeedback({ message: 'Sign in to write and share a personal page with the community.', kind: 'info' })
          return
        }
        if (!pageResponse.ok) throw new Error(data.error || 'Unable to load your writing right now. Please try again.')
        setPage(data.page)
        setMarkdown(data.page?.draftMarkdown ?? data.page?.publishedMarkdown ?? '')
      } catch (error) {
        if (active) setFeedback({ message: error instanceof Error ? error.message : 'Unable to load your writing right now. Please try again.', kind: 'error' })
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [embedded])

  async function save(publish: boolean) {
    setBusy(true)
    setFeedback(null)
    try {
      const response = await fetch('/api/connect/me/knowledge', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ markdown, publish }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to save your writing right now. Please try again.')
      setPage(data.page)
      setFeedback({
        message: publish ? 'Your page is now shared on your public profile.' : 'Saved for later. Only you can see this draft.',
        kind: 'success',
      })
    } catch (error) {
      setFeedback({ message: error instanceof Error ? error.message : 'Unable to save your writing right now. Please try again.', kind: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const saveActions = (
    <div className="connect-writing-actions">
      <Button variant="secondary" loading={busy} onClick={() => void save(false)}><Save size={15} /> Save for later</Button>
      <Button loading={busy} onClick={() => void save(true)}><Send size={15} /> Share on my profile</Button>
    </div>
  )

  if (loading) {
    const skeleton = <div className="connect-skeleton h-64" />
    return embedded
      ? <section id="knowledge-page" className="mt-12 scroll-mt-8">{skeleton}</section>
      : <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8">{skeleton}</div>
  }

  if (feedback?.kind === 'info') {
    const signInPrompt = (
      <Panel className="mx-auto max-w-xl p-8 text-center">
        <span className="connect-empty-icon"><BookOpenText size={22} /></span>
        <p className="connect-eyebrow mt-5">Your personal page</p>
        <h1 className="mt-2 font-clash text-3xl text-white">Sign in to your space.</h1>
        <p className="mt-3 text-sm leading-6 text-[#aab6c2]">Sign in to write about your experiences, share useful links, and offer guidance to the community.</p>
        <Link href="/connect/sign-in" className="connect-button connect-button-primary mt-6">Sign in</Link>
      </Panel>
    )
    return embedded
      ? <section id="knowledge-page" className="mt-12">{signInPrompt}</section>
      : <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8">{signInPrompt}</div>
  }

  const editor = (
    <>
      {feedback && <Feedback message={feedback.message} kind={feedback.kind} />}

      {!embedded && saveActions}
      <div className="connect-writing-layout">
        <Panel className="connect-writing-editor overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-7">
            <div className="flex items-center gap-2.5"><FileText size={16} className="text-[#7bd9f1]" /><span className="text-sm font-medium text-white">Your story, in your words</span></div>
            <span className="font-mono text-[10px] text-[#81919e]">{markdown.length.toLocaleString()} / 50,000</span>
          </div>
          <div className="connect-writing-tabs" role="group">
            <button
              type="button"
              aria-pressed={!showPreview}
              onClick={() => setShowPreview(false)}
              className={`connect-button connect-button-${showPreview ? 'quiet' : 'secondary'}`}
            >
              <FileText size={14} /> Edit
            </button>
            <button
              type="button"
              aria-pressed={showPreview}
              onClick={() => setShowPreview(true)}
              className={`connect-button connect-button-${showPreview ? 'secondary' : 'quiet'}`}
            >
              <Eye size={14} /> Preview
            </button>
          </div>
          {showPreview ? (
            <div className="connect-markdown-preview connect-markdown-editor-preview" data-lenis-prevent>
              {markdown.trim()
                ? <ConnectMarkdown markdown={markdown} />
                : <p className="text-[#81919e]">Your formatted preview will appear here as you write.</p>}
            </div>
          ) : (
            <textarea
              value={markdown}
              onChange={(event) => setMarkdown(event.target.value)}
              maxLength={50_000}
              spellCheck
              aria-label="Write your personal page in Markdown"
              placeholder={'# A little about me\n\nShare experiences, achievements, lessons, advice, or anything you would like to include.'}
              className="connect-markdown-editor"
              data-lenis-prevent
            />
          )}
          <div className="connect-writing-editor-footer">
            <p className="text-[10px] leading-5 text-[#81919e]">Markdown works here: use # for headings, - for lists, and [link text](https://...) for links.</p>
            {!markdown.trim() && (
              <Button type="button" variant="quiet" disabled={busy} onClick={() => setMarkdown(STARTER_TEMPLATE)}>
                Use starter template
              </Button>
            )}
          </div>
        </Panel>

        <aside className="connect-writing-aside">
          <Panel className="connect-writing-side-panel">
            <div className="flex items-center gap-2"><Eye size={15} className="text-[#7bd9f1]" /><h3 className="font-clash text-lg text-white">Currently shared</h3></div>
            <p className="mt-2 text-[11px] text-[#81919e]">
              {page?.publishedAt ? `Last shared ${new Date(page.publishedAt).toLocaleDateString()}` : 'Nothing shared yet.'}
            </p>
            <div className="connect-markdown-preview mt-4">
              {page?.publishedMarkdown
                ? <ConnectMarkdown markdown={page.publishedMarkdown} />
                : <p className="text-[#81919e]">Your page will appear on your public profile after you share it.</p>}
            </div>
          </Panel>
          <Panel className="connect-writing-side-panel">
            <p className="connect-eyebrow">Your space to express yourself</p>
            <p className="mt-3 text-xs leading-5 text-[#aab6c2]">
              There are no rules for what your page has to be. Share a college memory, a project in progress, an interview story, a lesson learned the hard way, a resource you love, or a goal you are chasing. Alumni can pass on advice; students can show what they are building and find collaborators. Go wild: add links, images, or GIFs, and make this page completely yours.
            </p>
            <p className="mt-3 text-xs leading-5 text-[#aab6c2]">
              Save a draft while you figure out what you want to say, then share it whenever you are ready. Shared writing appears on your profile when your profile visibility is public. Just leave out anything you would rather keep private.
            </p>
          </Panel>
          <Panel className="connect-writing-side-panel">
            <p className="connect-eyebrow">Markdown basics</p>
            <pre className="mt-3 whitespace-pre-wrap text-[11px] leading-6 text-[#aab6c2]">{'# A heading\n## A smaller heading\n- A list item\n[Link text](https://example.com)'}</pre>
          </Panel>
        </aside>
      </div>
    </>
  )

  if (embedded) {
    return (
      <section id="knowledge-page" className="connect-writing-section scroll-mt-8">
        <div className="connect-writing-header">
          <div>
            <p className="connect-eyebrow">Your story and experience</p>
            <h2 className="mt-2 font-clash text-3xl text-white">A page for anything you want to share.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#aab6c2]">
              Seriously—share whatever feels like you. A college experience, a project you are proud of (or still figuring out), an interview that taught you something, a life lesson, a useful resource, a big idea, or a tiny win. Current students can show what they are working on and find people to build with; alumni can share the advice or stories they wish they had heard sooner. There is no perfect format and no need to have it all figured out. Add links, images, or GIFs, get creative, and make this page your own.
            </p>
            <p className="mt-2 max-w-3xl text-xs leading-5 text-[#81919e]">
              Start with a few lines or write a whole story—save a private draft any time and share it when you feel ready. Shared writing appears on your profile when your profile visibility is public. Keep personal details private if you would not want the whole community to see them.
            </p>
          </div>
          {saveActions}
        </div>
        {editor}
      </section>
    )
  }

  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-20 pt-12 sm:px-8 sm:pt-16 lg:px-12 lg:pt-20">
      <Link href="/connect/dashboard" className="connect-back-link">Back to your profile</Link>
      <PageHeading
        eyebrow="Your writing"
        title={<>Share what you’ve <span className="connect-title-accent">learned.</span></>}
        description="A flexible page to share experiences, achievements, lessons, advice, useful links, or anything else you would like the community to know."
      />
      {editor}
    </div>
  )
}
