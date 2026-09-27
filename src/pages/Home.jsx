import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import Button from '../components/Button'
import { getSession } from '../utils/crypto'

export default function Home() {
  const navigate = useNavigate()
  useEffect(() => { if (getSession()?.ownerToken) navigate('/inbox', { replace: true }) }, [navigate])
  return <section className="mx-auto max-w-5xl py-8 sm:py-16">
    <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
      <div>
        <p className="eyebrow">A quieter place to be heard</p>
        <h1 className="mt-4 max-w-xl text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl">Invite honesty.<br/><span className="text-teal-700 dark:text-teal-300">Keep it private.</span></h1>
        <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600 dark:text-slate-300">SecretBox gives you one thoughtful link for unfiltered notes, kind words, questions, and feedback—without exposing who sent them.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link to="/create"><Button className="w-full sm:w-auto">Create your space</Button></Link><Link to="/login"><Button variant="secondary" className="w-full sm:w-auto">Open my inbox</Button></Link></div>
        <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-slate-500 dark:text-slate-400"><span>✓ No signup for senders</span><span>✓ One private inbox</span><span>✓ Yours to control</span></div>
      </div>
      <div className="relative mx-auto w-full max-w-md">
        <div className="absolute -inset-5 -z-10 rounded-[3rem] bg-teal-200/60 blur-3xl dark:bg-teal-700/20"/>
        <div className="rounded-[2rem] bg-[#15302e] p-6 text-white shadow-2xl sm:p-8">
          <div className="flex items-center justify-between text-sm text-teal-100"><span className="rounded-full bg-white/10 px-3 py-1">New note</span><span>now</span></div>
          <p className="mt-10 text-2xl font-semibold leading-snug">“You make people feel more capable than they thought they were.”</p>
          <div className="mt-10 border-t border-white/10 pt-5 text-sm text-teal-100">Shared anonymously with care</div>
        </div>
      </div>
    </div>
    <div className="mt-16 grid gap-4 md:grid-cols-3">
      {[['01','Make a link','A name is all you need to begin.'],['02','Share it anywhere','Post it where your people already are.'],['03','Read on your terms','Pause, manage, or clear your inbox anytime.']].map(([number,title,body]) => <div key={number} className="panel"><p className="eyebrow">{number}</p><h2 className="mt-5 text-lg font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{body}</p></div>)}
    </div>
  </section>
}
