import { BookOpenCheck, Clock3, EyeOff, Flower, Flower2, LockKeyhole, Play, Rabbit, RotateCcw, Shuffle, Sparkles, Star, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { SettingsDialog } from '../components/SettingsDialog'
import { useKanaStore } from '../stores/kanaStore'
import { formatTime, recentWrongCount, sessionSummary } from '../utils/stats'

export function HomePage() {
  const nav = useNavigate(), store = useKanaStore()
  const { preferences: p, setPreferences, activeSession, sessions, kanaProgress } = store
  const [settings, setSettings] = useState(false), [discard, setDiscard] = useState(false), [deleting, setDeleting] = useState<string | null>(null)
  const starred = Object.values(kanaProgress).filter(k => k.starred).length
  const recent = Object.keys(kanaProgress).filter(id => recentWrongCount(sessions, id) > 0).length
  const empty = p.reviewMode === 'starred' && !starred ? 'Star a few kana first to study them here.' : p.reviewMode === 'recent-mistakes' && !recent ? 'No recent mistakes — lovely work!' : null
  const chooseReview = (mode: 'starred' | 'recent-mistakes') => setPreferences({ reviewMode: mode })
  const chooseCharacterSet = (characterSet: 'hiragana' | 'katakana' | 'both') => setPreferences({ characterSet, reviewMode: 'none' })
  const setSeconds = (value: string) => setPreferences({ timerMs: Math.max(1, Math.min(60, Number(value) || 1)) * 1000 })
  const start = () => { if (store.startSession()) nav('/learn') }

  return <Layout onSettings={() => setSettings(true)}><main>
    <section className="hero"><div><p className="eyebrow">毎日、少しずつ</p><h1>お勉強しましょう？</h1><p>A little practice goes a long way ♡</p></div><div className="hero-art" aria-hidden><Rabbit /><Flower2 /></div></section>
    {activeSession && !activeSession.completed && <section className="resume-banner"><div><RotateCcw /><span><b>Study in progress</b><small>{activeSession.currentIndex + 1} of {activeSession.deck.length} cards</small></span></div><div><button onClick={() => nav('/learn')}>Resume session</button><button className="text-danger" onClick={() => setDiscard(true)}><Trash2 /> Discard</button></div></section>}
    <section className="paper-card setup">
      <div className="section-heading"><Flower2 /><div><h2>Study Setup</h2><p>Choose what you want to study</p></div></div>
      <div className="setup-grid">
        <fieldset><legend>Character set</legend><div className="choice-cards character-cards">{(['hiragana', 'katakana', 'both'] as const).map(value => <button key={value} className={p.reviewMode === 'none' && p.characterSet === value ? 'selected' : ''} onClick={() => chooseCharacterSet(value)} aria-pressed={p.reviewMode === 'none' && p.characterSet === value}><b>{value === 'hiragana' ? 'あ' : value === 'katakana' ? 'ア' : 'あ + ア'}</b><span>{value[0].toUpperCase() + value.slice(1)}</span></button>)}</div>
          <legend>Review</legend><div className="choice-cards review-cards">
            <button className={p.reviewMode === 'starred' ? 'selected' : ''} onClick={() => chooseReview('starred')} aria-pressed={p.reviewMode === 'starred'}><Star /><span><b>Starred only</b><small>{starred} available</small></span></button>
            <button className={p.reviewMode === 'recent-mistakes' ? 'selected' : ''} onClick={() => chooseReview('recent-mistakes')} aria-pressed={p.reviewMode === 'recent-mistakes'}><RotateCcw /><span><b>Mistakes from last 10</b><small>{recent} available</small></span></button>
          </div></fieldset>
        <div className="session-controls"><fieldset><legend>Options</legend><div className="option-buttons">
          <button className={p.reviewMistakesAtEnd ? 'is-on' : ''} onClick={() => setPreferences({ reviewMistakesAtEnd: !p.reviewMistakesAtEnd })} aria-pressed={p.reviewMistakesAtEnd}><RotateCcw /><span><b>Review mistakes</b><small>{p.reviewMistakesAtEnd ? 'On' : 'Off'}</small></span></button>
          <button className={p.shuffled ? 'is-on' : ''} onClick={() => setPreferences({ shuffled: !p.shuffled })} aria-pressed={p.shuffled}><Shuffle /><span><b>Shuffle cards</b><small>{p.shuffled ? 'On' : 'Off'}</small></span></button>
          <button className={p.lockNavigation ? 'is-on' : ''} onClick={() => setPreferences({ lockNavigation: !p.lockNavigation })} aria-pressed={p.lockNavigation}><LockKeyhole /><span><b>Lock back & forth</b><small>{p.lockNavigation ? 'On' : 'Off'}</small></span></button>
          <div className={`timer-option ${p.timerMs != null ? 'is-on' : ''}`}><button onClick={() => setPreferences({ timerMs: p.timerMs == null ? 3000 : null })} aria-pressed={p.timerMs != null}><Clock3 /><span><b>Timer</b><small>{p.timerMs != null ? 'On' : 'Off'}</small></span></button>{p.timerMs != null && <label className="seconds-input"><input aria-label="Timer seconds" type="number" min="1" max="60" value={p.timerMs / 1000} onChange={e => setSeconds(e.target.value)} /><span>sec</span></label>}</div>
        </div></fieldset><fieldset><legend>Settings</legend><div className="option-buttons setting-buttons">
          <button className={!p.recordSession ? 'is-on' : ''} onClick={() => setPreferences({ recordSession: !p.recordSession })} aria-pressed={!p.recordSession}><EyeOff /><span><b>Not record</b><small>{p.recordSession ? 'Off' : 'On'}</small></span></button>
          <button className={p.readyFirstCard ? 'is-on' : ''} onClick={() => setPreferences({ readyFirstCard: !p.readyFirstCard })} aria-pressed={p.readyFirstCard}><Sparkles /><span><b>Ready first card</b><small>{p.readyFirstCard ? 'On' : 'Off'}</small></span></button>
        </div></fieldset></div>
      </div>{empty && <p className="empty-note">{empty}</p>}<button className="primary start" disabled={!!empty || !!activeSession} onClick={start}><Play /> {p.reviewMode === 'none' ? 'Start Learning' : 'Start Review'}</button>
    </section>
    <section className="paper-card history">
      <div className="section-heading between"><div><h2>Recent Studies</h2><p>Your gentle learning rhythm</p></div>{sessions.length > 0 && <span>{sessions.filter(s => s.type === 'study').length} study sessions</span>}</div>
      {sessions.length === 0
        ? <div className="empty-history"><Clock3 /><p>Your completed sessions will bloom here.</p></div>
        : sessions.slice(0, 5).map(session => {
          const x = sessionSummary(session)
          return <article key={session.id} className={session.type === 'review' ? 'review-row' : ''}>
            <span className="history-kana">{session.source === 'both' ? <Flower aria-label="Both" /> : session.source === 'katakana' ? 'ア' : 'あ'}</span>
            <div><b>{session.type === 'review' ? `Review · ${session.source}` : session.source[0].toUpperCase() + session.source.slice(1)}</b><small>{new Date(session.finishedAt).toLocaleString()}</small></div>
            {session.type === 'study' ? <><strong>{x.correct} / {x.total}</strong><span>{Math.round(x.accuracy)}%</span><span>{x.wrong} mistakes</span><span>{formatTime(x.averageMs)} avg</span></> : <span className="review-count">{x.total} cards</span>}
            <div className="history-actions"><button className="history-review" onClick={() => nav(`/review/${session.id}`)} aria-label={`Review ${session.source} lesson`}><BookOpenCheck /> Review</button><button className="history-delete" onClick={() => setDeleting(session.id)} aria-label={`Delete ${session.source} record`}><Trash2 /></button></div>
          </article>
        })}
    </section>
  </main>{deleting && <div className="modal-backdrop"><div className="dialog mini" role="alertdialog"><h2>Delete this record?</h2><p>This removes only this completed session from your recent studies.</p><div className="dialog-actions"><button onClick={() => setDeleting(null)}>Keep it</button><button className="danger" onClick={() => { store.deleteSession(deleting); setDeleting(null) }}>Delete</button></div></div></div>}{settings && <SettingsDialog onClose={() => setSettings(false)} />}{discard && <div className="modal-backdrop"><div className="dialog mini" role="alertdialog"><h2>Discard this session?</h2><p>Your answers from this unfinished session will be removed.</p><div className="dialog-actions"><button onClick={() => setDiscard(false)}>Keep it</button><button className="danger" onClick={() => { store.discardSession(); setDiscard(false) }}>Discard</button></div></div></div>}</Layout>
}
