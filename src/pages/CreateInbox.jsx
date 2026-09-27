import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import Button from '../components/Button'
import { getSession, randomToken, saveSession } from '../utils/crypto'
import { requireSupabase } from '../lib/supabase'

export default function CreateInbox() {
  const [name, setName] = useState(''), [terms, setTerms] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('')
  const navigate = useNavigate()
  useEffect(() => { if (getSession()?.ownerToken) navigate('/inbox', { replace: true }) }, [navigate])
  async function create(e) {
    e.preventDefault(); const cleanName = name.trim(); if (!cleanName) return
    setBusy(true); setError('')
    try {
      const publicToken = randomToken(), ownerToken = randomToken()
      const { data, error } = await requireSupabase().rpc('create_inbox', { p_name: cleanName, p_public_token: publicToken, p_owner_token: ownerToken })
      const inbox = Array.isArray(data) ? data[0] : data
      if (error || !inbox?.id || !inbox?.public_token) throw error || new Error('Inbox creation failed.')
      saveSession({ id: inbox.id, name: inbox.name, publicToken: inbox.public_token, ownerToken, recoveryEnabled: false, isActive: true })
      navigate('/inbox')
    } catch (err) { setError(err.message || 'Something went wrong. Please try again.') } finally { setBusy(false) }
  }
  return <section className="mx-auto grid max-w-4xl gap-8 py-3 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
    <div><p className="eyebrow">Your corner of the internet</p><h1 className="mt-3 text-4xl font-bold tracking-tight">Set up a space for honest notes.</h1><p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">There is no public profile or social feed. Just a private inbox and a link you choose to share.</p><div className="mt-8 space-y-4">{[['Private by default','Only you can read what arrives.'],['Ready in moments','Choose a display name, then share your unique link.'],['Always in your hands','Pause your link or clear messages whenever you want.']].map(([title,body]) => <div key={title} className="flex gap-3"><span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal-100 text-xs text-teal-800 dark:bg-teal-950 dark:text-teal-200">✓</span><p className="text-sm text-slate-600 dark:text-slate-300"><b className="block text-slate-900 dark:text-white">{title}</b>{body}</p></div>)}</div></div>
    <form onSubmit={create} className="panel space-y-6 p-6 sm:p-8"><div><p className="eyebrow">Create a SecretBox</p><h2 className="mt-2 text-2xl font-bold">What should people call you?</h2></div><label className="block"><span className="label">Display name</span><input className="field" value={name} onChange={e => setName(e.target.value.slice(0, 80))} autoComplete="name" placeholder="e.g. Aanya" required/></label><label className="flex cursor-pointer gap-3 rounded-2xl bg-slate-50 p-4 text-sm leading-5 dark:bg-white/5"><input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} className="mt-0.5 h-4 w-4 rounded text-teal-700"/>I understand that anyone with my link can leave an anonymous message.</label>{error && <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}<Button disabled={busy || !name.trim() || !terms} className="w-full" type="submit">{busy ? 'Making your space...' : 'Create my SecretBox'}</Button><p className="text-center text-xs text-slate-500">No email. No follower count. No noise.</p></form>
  </section>
}
