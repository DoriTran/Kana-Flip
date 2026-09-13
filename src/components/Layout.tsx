import { BookOpen, House, Rabbit, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'

export function Layout({children,onSettings}:{children:React.ReactNode;onSettings?:()=>void}){return <div className="app-shell"><header className="site-header"><NavLink className="brand" to="/"><Rabbit className="bunny-mark" aria-hidden/><span><b>Kana Study</b><small>small steps, a kinder you ♡</small></span></NavLink><nav aria-label="Main navigation"><NavLink to="/"><House/> Home</NavLink><NavLink to="/alphabet"><BookOpen/> Alphabet</NavLink>{onSettings&&<button className="nav-button" onClick={onSettings} aria-label="Open settings"><Settings/></button>}</nav></header>{children}</div>}
