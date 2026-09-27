import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import CreateInbox from './pages/CreateInbox'
import PublicInbox from './pages/PublicInbox'
import RecoverInbox from './pages/RecoverInbox'
import Inbox from './pages/Inbox'
import Login from './pages/Login'
export default function App() { return <><Navbar/><main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12"><Routes><Route path="/" element={<Home/>}/><Route path="/create" element={<CreateInbox/>}/><Route path="/u/:publicToken" element={<PublicInbox/>}/><Route path="/login" element={<Login/>}/><Route path="/recover" element={<RecoverInbox/>}/><Route path="/inbox" element={<Inbox/>}/><Route path="*" element={<Home/>}/></Routes></main></> }
