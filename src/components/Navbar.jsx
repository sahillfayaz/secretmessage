import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { clearSession, getSession } from '../utils/crypto'

export default function Navbar() {
  const [dark, setDark] = useState(() => localStorage.theme === 'dark')
  const [session, setSession] = useState(getSession())
  const location = useLocation()
  const navigate = useNavigate()
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.theme = dark ? 'dark' : 'light' }, [dark])
  useEffect(() => { setSession(getSession()) }, [location.pathname])
  const nav = ({ isActive }) => `rounded-xl px-3 py-2 text-sm font-semibold ${isActive ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-200' : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'}`
  function logout() { clearSession(); setSession(null); navigate('/', { replace: true }) }
  const signedIn = Boolean(session?.ownerToken)
  return <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-[#f7f7f3]/85 backdrop-blur dark:border-white/10 dark:bg-[#101818]/85"><nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3"><Link to="/" className="flex items-center gap-2 font-bold tracking-tight"><span className="grid h-8 w-8 place-items-center rounded-xl bg-teal-700 text-sm text-white">S</span><span>SecretBox</span></Link><div className="flex items-center gap-1">{signedIn ? <><NavLink className={nav} to="/inbox">Inbox</NavLink><button className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:text-rose-700 dark:text-slate-300 dark:hover:text-rose-300" onClick={logout}>Log out</button></> : <><NavLink className={nav} to="/create">Create</NavLink><NavLink className={nav} to="/login">Login</NavLink></>}<button aria-label="Toggle dark mode" className="ml-1 rounded-xl p-2 text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-white/10" onClick={() => setDark(x => !x)}>{dark ? '☀️' : '🌙'}</button></div></nav></header>
}
