import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Loading from '../components/Loading'
import MessageCard from '../components/MessageCard'
import Modal from '../components/Modal'
import { clearSession, getSession, saveSession } from '../utils/crypto'
import { requireSupabase } from '../lib/supabase'


export default function Inbox() {
  const session = getSession()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteAllOpen, setDeleteAllOpen] = useState(false)
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(session?.name || '')
  const [editingKey, setEditingKey] = useState(false)
  const [key, setKey] = useState('')
  const [show, setShow] = useState(false)
  const [keyBusy, setKeyBusy] = useState(false)
  const [active, setActive] = useState(session?.isActive !== false)
  const valid = key.length >= 6
  const ownerArgs = session && { p_inbox_id: session.id, p_owner_token: session.ownerToken }

  const load = useCallback(async () => {
    if (!session?.ownerToken) return
    setLoading(true); setError('')
    try {
      const { data, error } = await requireSupabase().rpc('get_owner_messages', ownerArgs)
      if (error) throw error
      setMessages(data || [])
    } catch (err) { setError(`Unable to load your inbox: ${err.message || 'please sign in again.'}`) } finally { setLoading(false) }
  }, [session?.id, session?.ownerToken])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    const refreshOnReturn = () => { if (document.visibilityState === 'visible') load() }
    window.addEventListener('focus', refreshOnReturn)
    document.addEventListener('visibilitychange', refreshOnReturn)
    return () => { window.removeEventListener('focus', refreshOnReturn); document.removeEventListener('visibilitychange', refreshOnReturn) }
  }, [load])

  async function invoke(name, args) {
    const { error } = await requireSupabase().rpc(name, args)
    if (error) throw error
  }
  async function copy() {
    await navigator.clipboard.writeText(`${window.location.origin}/u/${session.publicToken}`)
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }
  async function shareBoard() {
    const text = `Send me an anonymous message on SecretBox: ${window.location.origin}/u/${session.publicToken}`
    if (navigator.share) await navigator.share({ title: 'My SecretBox', text, url: `${window.location.origin}/u/${session.publicToken}` })
    else await navigator.clipboard.writeText(text)
  }
  async function remove(id) {
    try { await invoke('delete_owner_message', { ...ownerArgs, p_message_id: id }); setMessages(x => x.filter(m => m.id !== id)) }
    catch { setError('Could not delete this message.') }
  }
  async function removeAll() {
    setDeleteAllOpen(false)
    try { await invoke('delete_all_owner_messages', ownerArgs); setMessages([]) }
    catch { setError('Could not delete messages.') }
  }
  async function saveName(e) {
    e.preventDefault()
    try { await invoke('update_inbox_name', { ...ownerArgs, p_name: name }); saveSession({ ...session, name: name.trim() }); setEditingName(false) }
    catch { setError('Could not update your name.') }
  }
  async function saveKey(e) {
    e.preventDefault(); if (!valid) return
    setKeyBusy(true)
    try {
      await invoke('set_recovery_key', { ...ownerArgs, p_recovery_key: key })
      saveSession({ ...session, recoveryEnabled: true }); setKey(''); setEditingKey(false)
    } catch { setError('Could not save your recovery key.') } finally { setKeyBusy(false) }
  }
  async function toggleActive() {
    try {
      const next = !active
      await invoke('set_inbox_active', { ...ownerArgs, p_is_active: next })
      setActive(next); saveSession({ ...session, isActive: next })
    } catch { setError('Could not update your public link.') }
  }
  async function deleteAccount() {
    setDeleteAccountOpen(false)
    try { await invoke('delete_inbox', ownerArgs); clearSession(); navigate('/') }
    catch { setError('Could not delete your inbox.') }
  }
  async function shareMessage(message) {
    const text = `Anonymous message for ${session.name}: “${message.message}”`
    if (navigator.share) await navigator.share({ title: 'SecretBox message', text })
    else { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800) }
  }

  if (!session?.ownerToken || !session?.publicToken) return <section className="mx-auto max-w-xl text-center"><h1 className="text-3xl font-bold">Sign in to your inbox</h1><p className="mt-3 text-slate-600 dark:text-slate-300">Use your board link and password to reopen your SecretBox.</p><div className="mt-6 flex justify-center gap-3"><Link to="/login"><Button>Login</Button></Link><Link to="/create"><Button variant="secondary">Create a new inbox</Button></Link></div></section>
  const link = `${window.location.origin}/u/${session.publicToken}`
  return <section>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-lg">Hi {session.name || 'there'} 👋</p><h1 className="text-3xl font-bold tracking-tight">Your Secret Inbox</h1></div><Button variant="secondary" onClick={load}>Refresh</Button></div>
    <div className="panel mt-7"><h2 className="font-semibold">Your public link</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{active ? 'Anyone with this link can send you an anonymous message.' : 'Your link is paused. It cannot receive messages right now.'}</p><div className="mt-3 flex gap-2"><code className="min-w-0 flex-1 truncate rounded-lg bg-slate-100 px-3 py-2.5 text-xs dark:bg-slate-950">{link}</code><Button variant="secondary" onClick={copy}>{copied ? 'Copied ✓' : 'Copy Link'}</Button></div><div className="mt-4 flex flex-wrap gap-2"><Button onClick={shareBoard}>Share Link</Button><a className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700" href={`https://wa.me/?text=${encodeURIComponent(`Send me an anonymous message: ${link}`)}`} target="_blank" rel="noreferrer">WhatsApp</a><Button variant="secondary" onClick={toggleActive}>{active ? 'Pause link' : 'Activate link'}</Button></div></div>
    <div className="panel mt-4"><h2 className="font-semibold">Profile</h2>{editingName ? <form className="mt-3 flex gap-2" onSubmit={saveName}><input className="field min-w-0" value={name} onChange={e => setName(e.target.value.slice(0, 80))} required/><Button>Save</Button></form> : <><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Display name: {session.name}</p><Button className="mt-4" variant="secondary" onClick={() => setEditingName(true)}>Change name</Button></>}</div>
    <div className="panel mt-4"><h2 className="font-semibold">🔐 Board password</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{session.recoveryEnabled ? 'Your password is enabled for login from another device.' : 'Set a password to log in to this board from another device.'}</p><Button variant="secondary" className="mt-4" onClick={() => setEditingKey(x => !x)}>{session.recoveryEnabled ? 'Change Password' : 'Set Password'}</Button>{editingKey && <form onSubmit={saveKey} className="mt-5 border-t pt-5"><label className="label" htmlFor="recovery-key">{session.recoveryEnabled ? 'New Password' : 'Create Password'}</label><div className="relative"><input id="recovery-key" type={show ? 'text' : 'password'} autoComplete="new-password" value={key} onChange={e => setKey(e.target.value)} className="field pr-16" placeholder="Minimum 6 characters"/><button type="button" className="absolute right-2 top-2 rounded-lg px-2 py-1.5 text-xs font-medium" onClick={() => setShow(s => !s)}>{show ? 'Hide' : 'Show'}</button></div><p className="mt-2 text-xs text-slate-500">Use at least 6 characters. Your password is stored only as a secure hash.</p><Button className="mt-4" disabled={keyBusy || !valid}>{keyBusy ? 'Saving...' : 'Save Password'}</Button></form>}</div>
    <div className="mt-7 flex items-center justify-between gap-4"><h2 className="text-xl font-bold">Your Messages</h2>{messages.length > 0 && <Button variant="danger" onClick={() => setDeleteAllOpen(true)}>Delete All Messages</Button>}</div>
    {error && <p role="alert" className="mt-4 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
    {loading ? <Loading>Loading messages...</Loading> : messages.length ? <div className="mt-4 grid gap-3">{messages.map(m => <MessageCard key={m.id} message={m} onDelete={remove} onShare={shareMessage}/>)}</div> : <div className="panel mt-4 text-center"><p className="font-medium">No messages yet.</p><p className="mt-1 text-sm text-slate-500">Share your public link to receive anonymous messages.</p></div>}
    <div className="panel mt-7 border-rose-200 dark:border-rose-900"><h2 className="font-semibold text-rose-700 dark:text-rose-300">Danger zone</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Permanently delete this inbox and every message it contains.</p><Button className="mt-4" variant="danger" onClick={() => setDeleteAccountOpen(true)}>Delete inbox</Button></div>
    <Modal open={deleteAllOpen} title="Delete all messages?" onClose={() => setDeleteAllOpen(false)} onConfirm={removeAll} confirmText="Delete all">This permanently removes every message in your inbox.</Modal>
    <Modal open={deleteAccountOpen} title="Delete your inbox?" onClose={() => setDeleteAccountOpen(false)} onConfirm={deleteAccount} confirmText="Delete inbox">This permanently removes your inbox, recovery key, and all messages. It cannot be undone.</Modal>
  </section>
}
