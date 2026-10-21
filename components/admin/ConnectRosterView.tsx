'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import {
  ArrowDownToLine,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  FileUp,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  UsersRound,
  X,
} from 'lucide-react'

type RosterEntry = {
  usn: string
  fullName: string
  isActive: boolean
  importedAt: string
}

type RosterResponse = {
  entries: RosterEntry[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

const tabs = [
  { value: 'active', label: 'Active students' },
  { value: 'inactive', label: 'Inactive students' },
  { value: 'all', label: 'Everyone' },
] as const

export default function ConnectRosterView() {
  const [entries, setEntries] = useState<RosterEntry[]>([])
  const [status, setStatus] = useState<(typeof tabs)[number]['value']>('active')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<RosterResponse['pagination'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const [usn, setUsn] = useState('')
  const [fullName, setFullName] = useState('')
  const [editing, setEditing] = useState<RosterEntry | null>(null)
  const [importText, setImportText] = useState('')
  const [replace, setReplace] = useState(false)
  const [showImport, setShowImport] = useState(false)

  const loadEntries = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ page: String(page), limit: '25', status })
    if (query.trim()) params.set('q', query.trim())
    try {
      const response = await fetch(`/api/admin/connect/roster?${params}`, { cache: 'no-store', signal })
      const data = await response.json()
      if (response.status === 401 || response.status === 403) {
        setAuthorized(false)
        return
      }
      if (!response.ok) throw new Error(data.error || 'Unable to load the student list.')
      setAuthorized(true)
      setEntries(data.entries)
      setPagination(data.pagination)
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return
      setError(cause instanceof Error ? cause.message : 'Unable to load the student list.')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [page, query, status])

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => void loadEntries(controller.signal), 180)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadEntries])

  async function mutate(method: 'POST' | 'PUT' | 'DELETE', payload?: Record<string, unknown>, path = '/api/admin/connect/roster') {
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      const response = await fetch(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        ...(payload ? { body: JSON.stringify(payload) } : {}),
      })
      const data = method === 'DELETE' ? await response.json() : await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not save this change. Please try again.')
      setSuccess('The student list has been updated.')
      setEditing(null)
      setUsn('')
      setFullName('')
      await loadEntries()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save this change. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function addEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await mutate('POST', { usn, fullName })
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) return
    await mutate('PUT', { usn: editing.usn, newUsn: usn, fullName })
  }

  async function importEntries(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    let entriesToImport: Array<{ usn: string; fullName: string }>
    try {
      entriesToImport = importText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line, index) => {
        const separator = line.indexOf(',')
        if (separator < 1 || !line.slice(separator + 1).trim()) throw new Error(`On line ${index + 1}, add the student’s USN, a comma, and their full name.`)
        return { usn: line.slice(0, separator).trim(), fullName: line.slice(separator + 1).trim() }
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Review the import format.')
      return
    }
    if (entriesToImport.length === 0) {
      setError('Add at least one student before importing the list.')
      return
    }
    if (replace && !window.confirm(`Replace the current student list with these ${entriesToImport.length} students? Anyone left off the list will lose signup access, and their existing profile will be hidden.`)) return
    await mutate('POST', { entries: entriesToImport, replace })
    setImportText('')
    setReplace(false)
    setShowImport(false)
  }

  async function deactivate(entry: RosterEntry) {
    if (!window.confirm(`Remove ${entry.fullName} (${entry.usn}) from the active student list? Their existing profile will be hidden.`)) return
    await mutate('DELETE', undefined, `/api/admin/connect/roster?usn=${encodeURIComponent(entry.usn)}`)
  }

  if (authorized === false) {
    return (
      <div className="px-5 py-20 text-[#111827]">
        <section className="mx-auto max-w-lg rounded-3xl border border-[#e2e8f0] bg-white p-8 text-center shadow-sm">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-700"><ShieldAlert size={22} /></span>
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[.18em] text-amber-700">Page unavailable</p>
          <h1 className="mt-2 font-clash text-3xl font-semibold">This page isn’t available.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">You can return to Nexora and continue exploring the community.</p>
          <Link href="/" className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-[#111827] px-4 text-sm font-medium text-white">Return to Nexora <ArrowLeft size={14} /></Link>
        </section>
      </div>
    )
  }

  return (
    <div className="text-[#111827]">
      <div>
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.18em] text-[#0784a5]"><span className="h-1.5 w-1.5 rounded-full bg-[#08a6c8]" /> Nexora Connect · Administration</p>
            <h1 className="mt-2 font-clash text-4xl font-semibold tracking-tight sm:text-5xl">ISE student list</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">Students use this list to join Nexora Connect. Keep names and USNs accurate; name changes may require a profile to be checked again.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { setShowImport((visible) => !visible); setError('') }} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"><FileUp size={15} /> Add a list of students</button>
          </div>
        </header>

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="min-w-0">
            <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <label className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-3 focus:ring-cyan-500/10" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Find a student by USN or name" />
              </label>
              <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                {tabs.map((tab) => <button type="button" key={tab.value} onClick={() => { setStatus(tab.value); setPage(1) }} className={`rounded-lg px-3 text-[11px] font-medium transition ${status === tab.value ? 'bg-[#111827] text-white' : 'text-slate-500 hover:text-slate-900'}`}>{tab.label}</button>)}
              </div>
            </div>

            {(error || success) && (
              <div role={error ? 'alert' : 'status'} className={`mb-4 flex items-start gap-2 rounded-xl border p-3 text-xs ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                {error || success}
                <button type="button" aria-label="Dismiss message" onClick={() => { setError(''); setSuccess('') }} className="ml-auto"><X size={14} /></button>
              </div>
            )}

            {showImport && (
              <form onSubmit={importEntries} className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div><h2 className="font-semibold">Add several students</h2><p className="mt-1 text-xs leading-5 text-slate-500">Add one student per line: USN, then a comma, then their full name.</p></div>
                  <button type="button" onClick={() => setShowImport(false)} aria-label="Close bulk import" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X size={16} /></button>
                </div>
                <textarea value={importText} onChange={(event) => setImportText(event.target.value)} className="mt-4 min-h-36 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-6 outline-none focus:border-cyan-500" placeholder={'4AL22IS001,Ada Lovelace\n4AL22IS002,Grace Hopper'} />
                <label className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <input type="checkbox" checked={replace} onChange={(event) => setReplace(event.target.checked)} className="mt-0.5 accent-amber-600" />
                  <span><strong className="block text-xs text-amber-900">Replace the current student list</strong><small className="mt-1 block text-[11px] leading-5 text-amber-800">Students left off this list will lose signup access, and their existing profiles will be hidden. Choose this only when adding the full, up-to-date list.</small></span>
                </label>
                <button type="submit" disabled={busy} className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-[#111827] px-4 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"><ArrowDownToLine size={14} /> {busy ? 'Adding students…' : 'Add students'}</button>
              </form>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700"><UsersRound size={15} className="text-cyan-700" /> Students</div>
                <span className="text-[11px] text-slate-400">{pagination?.total ?? 0} students</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[610px] text-left">
                  <thead><tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400"><th className="px-5 py-3 font-medium">Student</th><th className="px-4 py-3 font-medium">USN</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Updated</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading && entries.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-xs text-slate-400">Loading students…</td></tr>}
                    {!loading && entries.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-xs text-slate-400">No students to show here yet.</td></tr>}
                    {entries.map((entry) => (
                      <tr key={entry.usn} className="group transition hover:bg-slate-50/80">
                        <td className="px-5 py-3.5"><p className="text-sm font-medium text-slate-800">{entry.fullName}</p><p className="mt-1 text-[10px] text-slate-400">ISE · AJIET</p></td>
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-600">{entry.usn}</td>
                        <td className="px-4 py-3.5"><span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${entry.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{entry.isActive ? 'Active' : 'Inactive'}</span></td>
                        <td className="px-4 py-3.5 text-xs text-slate-500">{new Date(entry.importedAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3.5"><div className="flex justify-end gap-1">
                          {entry.isActive && <button type="button" onClick={() => { setEditing(entry); setUsn(entry.usn); setFullName(entry.fullName); setError(''); setSuccess('') }} className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100">Edit</button>}
                          {entry.isActive
                            ? <button type="button" onClick={() => void deactivate(entry)} aria-label={`Deactivate ${entry.usn}`} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={14} /></button>
                            : <button type="button" onClick={() => void mutate('POST', { usn: entry.usn, fullName: entry.fullName })} className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-cyan-700 hover:bg-cyan-50">Reactivate</button>}
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-[11px] text-slate-500 sm:px-5">
                <span>Page {page} of {pagination?.totalPages || 1}</span>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setPage((current) => current - 1)} disabled={page <= 1 || loading} aria-label="Previous page" className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft size={15} /></button>
                  <button type="button" onClick={() => setPage((current) => current + 1)} disabled={page >= (pagination?.totalPages ?? 1) || loading} aria-label="Next page" className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40"><ChevronRight size={15} /></button>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <form onSubmit={editing ? saveEdit : addEntry} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-50 text-cyan-700"><Plus size={17} /></span><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-cyan-700">Student list</p><h2 className="mt-0.5 font-semibold">{editing ? 'Update student details' : 'Add a student'}</h2></div></div>
              <label className="mt-5 block"><span className="mb-1.5 block text-[11px] font-medium text-slate-600">{editing ? 'Corrected USN (optional)' : 'Official USN'}</span><input value={usn} onChange={(event) => setUsn(event.target.value.toUpperCase())} required maxLength={20} placeholder="4AL22IS001" className="h-10 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs outline-none focus:border-cyan-500 focus:ring-3 focus:ring-cyan-500/10" /></label>
              <label className="mt-3 block"><span className="mb-1.5 block text-[11px] font-medium text-slate-600">Official full name</span><input value={fullName} onChange={(event) => setFullName(event.target.value)} required maxLength={120} placeholder="As recorded by the department" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500 focus:ring-3 focus:ring-cyan-500/10" /></label>
              <div className="mt-4 flex gap-2">
                <button type="submit" disabled={busy} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#111827] px-3 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">{editing ? <Check size={14} /> : <Plus size={14} />}{busy ? 'Saving…' : editing ? 'Save changes' : 'Add student'}</button>
                {editing && <button type="button" onClick={() => { setEditing(null); setUsn(''); setFullName('') }} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Cancel edit"><X size={15} /></button>}
              </div>
            </form>
            <div className="rounded-2xl border border-cyan-100 bg-[#effbfe] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-cyan-800">Important</p>
              <p className="mt-2 text-xs leading-5 text-cyan-950/75">Student numbers stay on record to protect existing accounts. Removing someone from the active list hides their profile but does not erase their account history.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
