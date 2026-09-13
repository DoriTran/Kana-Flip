import {
  BookOpen, BookOpenCheck, CheckCircle2, ClipboardList, Clock3, EyeOff, Flower,
  Flower2, Info, LockKeyhole, Play, Rabbit, RotateCcw, Settings2, Shuffle,
  SlidersHorizontal, Sparkles, Star, Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { SettingsDialog } from '../components/SettingsDialog'
import { useKanaStore } from '../stores/kanaStore'
import { formatTime, recentWrongCount, sessionSummary } from '../utils/stats'

export function HomePage() {
  const nav = useNavigate()
  const store = useKanaStore()
  const { preferences: p, setPreferences, activeSession, sessions, kanaProgress } = store
  const [settings, setSettings] = useState(false)
  const [discard, setDiscard] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const starred = Object.values(kanaProgress).filter(kana => kana.starred).length
  const recent = Object.keys(kanaProgress).filter(id => recentWrongCount(sessions, id) > 0).length
  const empty = p.reviewMode === 'starred' && !starred
    ? 'Star a few kana first to study them here.'
    : p.reviewMode === 'recent-mistakes' && !recent ? 'No recent mistakes — lovely work!' : null
  const chooseReview = (reviewMode: 'starred' | 'recent-mistakes') => setPreferences({ reviewMode })
  const chooseCharacterSet = (characterSet: 'hiragana' | 'katakana' | 'both') =>
    setPreferences({ characterSet, reviewMode: 'none' })
  const start = () => { if (store.startSession()) nav('/learn') }
  const toggleTimer = () => setPreferences({ timerMs: p.timerMs == null ? 5000 : null })
  const setTimerSeconds = (value: string) => {
    const seconds = Math.max(1, Math.min(60, Number(value) || 1))
    setPreferences({ timerMs: seconds * 1000 })
  }

  return <Layout onSettings={() => setSettings(true)}><main>
    <section className="hero"><div><p className="eyebrow">毎日、少しずつ</p><h1>お勉強しましょう？</h1><p>A little practice goes a long way ♡</p></div><div className="hero-art" aria-hidden><Rabbit /><Flower2 /></div></section>
    {activeSession && !activeSession.completed && <section className="resume-banner"><div><RotateCcw /><span><b>Study in progress</b><small>{activeSession.currentIndex + 1} of {activeSession.deck.length} cards</small></span></div><div><button onClick={() => nav('/learn')}>Resume session</button><button className="text-danger" onClick={() => setDiscard(true)}><Trash2 /> Discard</button></div></section>}

    <section className="paper-card setup setup-redesign">
      <header className="setup-redesign-header">
        <div className="section-heading"><Flower2 /><div><h2>Study Setup</h2><p>Choose what you want to study ♡</p></div></div>
        <div className="setup-motto" aria-hidden>Small steps<br />big progress ♡ <Flower /></div>
      </header>
      <div className="setup-columns">
        <section className="setup-panel">
          <div className="setup-panel-heading"><BookOpen /><div><h3>Character set</h3><p>Choose which kana to study</p></div></div>
          <div className="study-choice-grid character-choice-grid">
            {(['hiragana', 'katakana', 'both'] as const).map(value => {
              const selected = p.reviewMode === 'none' && p.characterSet === value
              return <button key={value} className={'study-choice-card character-choice' + (selected ? ' selected' : '')} onClick={() => chooseCharacterSet(value)} aria-pressed={selected}>
                {selected && <CheckCircle2 className="choice-check" />}
                <span className="choice-kana">{value === 'hiragana' ? 'あ' : value === 'katakana' ? 'ア' : 'あ + ア'}</span>
                <strong>{value[0].toUpperCase() + value.slice(1)}</strong>
                <small>{value === 'both' ? 92 : 46} characters</small>
              </button>
            })}
          </div>
          <div className="setup-divider" />
          <div className="setup-panel-heading"><RotateCcw /><div><h3>Review mode</h3><p>Focus on specific cards (optional)</p></div></div>
          <div className="study-choice-grid review-choice-grid">
            <button className={'study-choice-card review-choice' + (p.reviewMode === 'starred' ? ' selected' : '')} onClick={() => chooseReview('starred')} aria-pressed={p.reviewMode === 'starred'}>
              {p.reviewMode === 'starred' && <CheckCircle2 className="choice-check" />}<Star /><span><strong>Starred only</strong><small>{starred} available · Practice your starred cards</small></span>
            </button>
            <button className={'study-choice-card review-choice' + (p.reviewMode === 'recent-mistakes' ? ' selected' : '')} onClick={() => chooseReview('recent-mistakes')} aria-pressed={p.reviewMode === 'recent-mistakes'}>
              {p.reviewMode === 'recent-mistakes' && <CheckCircle2 className="choice-check" />}<ClipboardList /><span><strong>Mistakes from last 10 studies</strong><small>{recent} available · Cards missed recently</small></span>
            </button>
          </div>
          <p className="setup-info"><Info /> Review sessions don’t affect your main study statistics.</p>
        </section>

        <section className="setup-panel">
          <div className="setup-panel-heading"><SlidersHorizontal /><div><h3>Options</h3><p>Customize your session</p></div></div>
          <div className="setup-toggle-list">
            <button className={'setup-toggle-card' + (p.reviewMistakesAtEnd ? ' is-on' : '')} onClick={() => setPreferences({ reviewMistakesAtEnd: !p.reviewMistakesAtEnd })} aria-pressed={p.reviewMistakesAtEnd}>
              <RotateCcw /><span><strong>Review mistakes at end</strong><small>Practice cards you got wrong after the main deck</small></span><i className="setup-switch" aria-hidden />
            </button>
            <button className={'setup-toggle-card' + (p.shuffled ? ' is-on' : '')} onClick={() => setPreferences({ shuffled: !p.shuffled })} aria-pressed={p.shuffled}>
              <Shuffle /><span><strong>Shuffle cards</strong><small>Show cards in random order</small></span><i className="setup-switch" aria-hidden />
            </button>
            <div
              className={'setup-toggle-card timer-setting-card' + (p.timerMs != null ? ' is-on' : '')}
              role="switch"
              tabIndex={0}
              aria-checked={p.timerMs != null}
              onClick={toggleTimer}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  toggleTimer()
                }
              }}
            >
              <Clock3 /><span><strong>Timer</strong><small>Auto mark as wrong when time runs out</small></span>
              <div className="timer-control" aria-label="Timer duration">
                <span className={p.timerMs == null ? 'active' : ''}>Off</span>
                <label className={p.timerMs != null ? 'active' : ''} onClick={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>
                  <input
                    aria-label="Timer seconds"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="60"
                    value={(p.timerMs ?? 5000) / 1000}
                    onChange={event => setTimerSeconds(event.target.value)}
                    onFocus={() => { if (p.timerMs == null) setPreferences({ timerMs: 5000 }) }}
                  />
                  <span>s</span>
                </label>
              </div>
            </div>
          </div>
          <div className="setup-divider" />
          <div className="setup-panel-heading"><Settings2 /><div><h3>Settings</h3><p>Session preferences</p></div></div>
          <div className="setup-toggle-list">
            <button className={'setup-toggle-card' + (!p.recordSession ? ' is-on' : '')} onClick={() => setPreferences({ recordSession: !p.recordSession })} aria-pressed={!p.recordSession}>
              <EyeOff /><span><strong>Not record</strong><small>Practice mode (don’t save results)</small></span><i className="setup-switch" aria-hidden />
            </button>
            <button className={'setup-toggle-card' + (p.readyFirstCard ? ' is-on' : '')} onClick={() => setPreferences({ readyFirstCard: !p.readyFirstCard })} aria-pressed={p.readyFirstCard}>
              <Sparkles /><span><strong>Ready first card</strong><small>Show a ready screen before the first card</small></span><i className="setup-switch" aria-hidden />
            </button>
            <button className={'setup-toggle-card' + (p.lockNavigation ? ' is-on' : '')} onClick={() => setPreferences({ lockNavigation: !p.lockNavigation })} aria-pressed={p.lockNavigation}>
              <LockKeyhole /><span><strong>Lock back &amp; forth</strong><small>Hide Previous and Next navigation</small></span><i className="setup-switch" aria-hidden />
            </button>
          </div>
        </section>
      </div>
      {empty && <p className="empty-note">{empty}</p>}
      <button className="primary start" disabled={!!empty || !!activeSession} onClick={start}><Play /> {p.reviewMode === 'none' ? 'Start Learning' : 'Start Review'}</button>
      <div className="setup-corner-art left" aria-hidden><Rabbit /><Flower2 /></div>
      <div className="setup-corner-art right" aria-hidden><Flower /><Flower2 /></div>
    </section>

    <section className="paper-card history">
      <div className="section-heading between"><div><h2>Recent Studies</h2><p>Your gentle learning rhythm</p></div>{sessions.length > 0 && <span>{sessions.filter(session => session.type === 'study').length} study sessions</span>}</div>
      {sessions.length === 0 ? <div className="empty-history"><Clock3 /><p>Your completed sessions will bloom here.</p></div> : sessions.slice(0, 5).map(session => {
        const summary = sessionSummary(session)
        return <article key={session.id} className={session.type === 'review' ? 'review-row' : ''}>
          <span className="history-kana">{session.source === 'both' ? <Flower aria-label="Both" /> : session.source === 'katakana' ? 'ア' : 'あ'}</span>
          <div><b>{session.type === 'review' ? 'Review · ' + session.source : session.source[0].toUpperCase() + session.source.slice(1)}</b><small>{new Date(session.finishedAt).toLocaleString()}</small></div>
          {session.type === 'study' ? <><strong>{summary.correct} / {summary.total}</strong><span>{Math.round(summary.accuracy)}%</span><span>{summary.wrong} mistakes</span><span>{formatTime(summary.averageMs)} avg</span></> : <span className="review-count">{summary.total} cards</span>}
          <div className="history-actions"><button className="history-review" onClick={() => nav('/review/' + session.id)} aria-label={'Review ' + session.source + ' lesson'}><BookOpenCheck /> Review</button><button className="history-delete" onClick={() => setDeleting(session.id)} aria-label={'Delete ' + session.source + ' record'}><Trash2 /></button></div>
        </article>
      })}
    </section>
  </main>
  {deleting && <div className="modal-backdrop"><div className="dialog mini" role="alertdialog"><h2>Delete this record?</h2><p>This removes only this completed session from your recent studies.</p><div className="dialog-actions"><button onClick={() => setDeleting(null)}>Keep it</button><button className="danger" onClick={() => { store.deleteSession(deleting); setDeleting(null) }}>Delete</button></div></div></div>}
  {settings && <SettingsDialog onClose={() => setSettings(false)} />}
  {discard && <div className="modal-backdrop"><div className="dialog mini" role="alertdialog"><h2>Discard this session?</h2><p>Your answers from this unfinished session will be removed.</p><div className="dialog-actions"><button onClick={() => setDiscard(false)}>Keep it</button><button className="danger" onClick={() => { store.discardSession(); setDiscard(false) }}>Discard</button></div></div></div>}
  </Layout>
}
