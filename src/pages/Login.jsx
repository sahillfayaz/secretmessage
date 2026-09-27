import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import { randomToken, saveSession } from '../utils/crypto'
import { requireSupabase } from '../lib/supabase'

export default function Login() {
  const [link, setLink] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  async function login(e) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      const publicToken = link.trim().split('/').filter(Boolean).pop()
      const ownerToken = randomToken()
      const { data, error } = await requireSupabase().rpc('login_inbox', { p_public_token: publicToken, p_password: password, p_new_owner_token: ownerToken })
      const inbox = Array.isArray(data) ? data[0] : data
      if (error || !inbox?.id) throw new Error()
      saveSession({ id: inbox.id, name: inbox.name, publicToken: inbox.public_token, ownerToken, recoveryEnabled: true, isActive: inbox.is_active })
      navigate('/inbox')
    } catch { setError('Invalid board link or password. Please try again.') } finally { setBusy(false) }
  }
  return <section className="mx-auto max-w-md"><div className="panel mt-6"><div className="text-center"><p className="text-4xl">💌</p><h1 className="mt-4 text-3xl font-bold">Welcome Back</h1><p className="mt-2 text-slate-600 dark:text-slate-300">Login to view your secret messages.</p></div><form onSubmit={login} className="mt-8 space-y-5"><label className="block"><span className="label">Your Board Link</span><input className="field" value={link} onChange={e => setLink(e.target.value)} placeholder="your-site.com/u/abc123..." required/></label><label className="block"><span className="label">Password</span><div className="relative"><input className="field pr-16" type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" minLength="6" required/><button type="button" className="absolute right-3 top-3 text-xs font-medium" onClick={() => setShow(x => !x)}>{show ? 'Hide' : 'Show'}</button></div></label>{error && <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}<Button className="w-full" disabled={busy}>{busy ? 'Verifying...' : 'Login to my Board'}</Button></form><p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">Don't have a board? <Link className="font-semibold text-indigo-600 dark:text-indigo-400" to="/create">Create one free →</Link></p></div></section>
}
