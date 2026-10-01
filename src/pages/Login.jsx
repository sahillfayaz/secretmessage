import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import { randomToken, saveSession } from '../utils/crypto'
import { requireSupabase } from '../lib/supabase'

function getPublicToken(value) {
  const input = value.trim()
  if (!input) return ''

  let pathname
  try {
    pathname = new URL(input.includes('://') ? input : `https://${input}`).pathname
  } catch {
    pathname = input
  }

  const segments = pathname.split('/').filter(Boolean)
  const userIndex = segments.lastIndexOf('u')
  if (userIndex >= 0 && userIndex === segments.length - 2) {
    try { return decodeURIComponent(segments[userIndex + 1]) } catch { return '' }
  }
  return segments.length === 1 && !input.includes('.') && !input.includes('://') ? segments[0] : ''
}

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
      const publicToken = getPublicToken(link)
      if (!publicToken) {
        setError('Enter the full inbox link, such as https://your-site.com/u/your-token.')
        return
      }
      const ownerToken = randomToken()
      const { data, error } = await requireSupabase().rpc('login_inbox', { p_public_token: publicToken, p_password: password, p_new_owner_token: ownerToken })
      if (error) {
        console.error('SecretBox login service error:', error)
        setError('The login service could not complete your request. Please retry; if it continues, check the Supabase login_inbox function and deployment logs.')
        return
      }
      const inbox = Array.isArray(data) ? data[0] : data
      if (!inbox?.id) {
        setError('Invalid board link or password. Please try again.')
        return
      }
      saveSession({ id: inbox.id, name: inbox.name, publicToken: inbox.public_token, ownerToken, recoveryEnabled: true, isActive: inbox.is_active })
      navigate('/inbox')
    } catch (err) {
      console.error('SecretBox login failed:', err)
      setError('Could not reach the login service. Check your connection and try again.')
    } finally { setBusy(false) }
  }
  return <section className="mx-auto max-w-md"><div className="panel mt-6"><div className="text-center"><p className="text-4xl">💌</p><h1 className="mt-4 text-3xl font-bold">Welcome Back</h1><p className="mt-2 text-slate-600 dark:text-slate-300">Login to view your secret messages.</p></div><form onSubmit={login} className="mt-8 space-y-5"><label className="block"><span className="label">Your Board Link</span><input className="field" value={link} onChange={e => setLink(e.target.value)} placeholder="your-site.com/u/abc123..." required/></label><label className="block"><span className="label">Password</span><div className="relative"><input className="field pr-16" type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" minLength="6" required/><button type="button" className="absolute right-3 top-3 text-xs font-medium" onClick={() => setShow(x => !x)}>{show ? 'Hide' : 'Show'}</button></div></label>{error && <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}<Button className="w-full" disabled={busy}>{busy ? 'Verifying...' : 'Login to my Board'}</Button></form><p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">Don't have a board? <Link className="font-semibold text-indigo-600 dark:text-indigo-400" to="/create">Create one free →</Link></p></div></section>
}
