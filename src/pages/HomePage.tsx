import {
  BookOpen, CheckCircle2, ClipboardList, Clock3, EyeOff, Flower,
  Flower2, Gauge, Info, LockKeyhole, Play, Rabbit, RotateCcw, Settings2, Shuffle,
  SlidersHorizontal, Sparkles, Star, Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { SettingsDialog } from '../components/SettingsDialog'
import { useKanaStore } from '../stores/kanaStore'
import { recentWrongCount, slowReviewIds } from '../utils/stats'

export function HomePage() {
  const nav = useNavigate()
  const store = useKanaStore()
  const { preferences: p, setPreferences, activeSession, sessions, kanaProgress } = store
  const [settings, setSettings] = useState(false)
  const [discard, setDiscard] = useState(false)

  const [slowThresholdInput, setSlowThresholdInput] = useState(String(p.slowThresholdMs / 1000))
  const [slowTopInput, setSlowTopInput] = useState(String(p.slowTopCount))
  const starred = Object.values(kanaProgress).filter(kana => kana.starred).length
  const recent = Object.keys(kanaProgress).filter(id => recentWrongCount(sessions, id) > 0).length
  const slowIds = slowReviewIds(sessions, p.slowReviewMode, p.slowThresholdMs, p.slowTopCount)
  const empty = p.reviewMode === 'starred' && !starred
    ? 'Star a few kana first to study them here.'
    : p.reviewMode === 'recent-mistakes' && !recent ? 'No recent mistakes — lovely work!'
      : p.reviewMode === 'slowest' && !slowIds.length
        ? p.slowReviewMode === 'over-threshold'
          ? `No cards currently over ${Number((p.slowThresholdMs / 1000).toFixed(2))}s.`
          : 'No recorded cards available for Top ' + p.slowTopCount + ' yet.'
        : null
  const chooseReview = (reviewMode: 'starred' | 'recent-mistakes' | 'slowest') => setPreferences({ reviewMode })
  const chooseCharacterSet = (characterSet: 'hiragana' | 'katakana' | 'both') =>
    setPreferences({ characterSet, reviewMode: 'none' })
  useEffect(() => {
    if (activeSession?.completed) useKanaStore.getState().archiveActive()
  }, [activeSession?.id, activeSession?.completed])

  const start = () => { if (store.startSession()) nav('/learn') }
  const toggleTimer = () => setPreferences({ timerMs: p.timerMs == null ? 5000 : null })
  const setTimerSeconds = (value: string) => {
    const seconds = Math.max(1, Math.min(60, Number(value) || 1))
    setPreferences({ timerMs: seconds * 1000 })
  }
  const changeSlowTop = (value: string) => {
    if (!/^\d{0,2}$/.test(value) || Number(value) > 92) return
    setSlowTopInput(value)
    const count = Number(value)
    if (value && count > 0) setPreferences({ reviewMode: 'slowest', slowReviewMode: 'top-30', slowTopCount: count })
  }
  const commitSlowTop = () => {
    const count = Number(slowTopInput)
    if (!slowTopInput || !Number.isInteger(count) || count < 1 || count > 92) {
      setSlowTopInput('30')
      setPreferences({ reviewMode: 'slowest', slowReviewMode: 'top-30', slowTopCount: 30 })
      return
    }
    setSlowTopInput(String(count))
    setPreferences({ reviewMode: 'slowest', slowReviewMode: 'top-30', slowTopCount: count })
  }
  const changeSlowThreshold = (value: string) => {
    if (!/^\d{0,2}(?:\.\d{0,2})?$/.test(value) || Number(value) > 60) return
    setSlowThresholdInput(value)
    const seconds = Number(value)
    if (value && seconds > 0) setPreferences({ reviewMode: 'slowest', slowReviewMode: 'over-threshold', slowThresholdMs: seconds * 1000 })
  }
  const commitSlowThreshold = () => {
    const seconds = Number(slowThresholdInput)
    if (!slowThresholdInput || !Number.isFinite(seconds) || seconds <= 0) {
      setSlowThresholdInput('5')
      setPreferences({ reviewMode: 'slowest', slowReviewMode: 'over-threshold', slowThresholdMs: 5000 })
      return
    }
    const normalized = Number(seconds.toFixed(2))
    setSlowThresholdInput(String(normalized))
    setPreferences({ reviewMode: 'slowest', slowReviewMode: 'over-threshold', slowThresholdMs: normalized * 1000 })
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
              {p.reviewMode === 'recent-mistakes' && <CheckCircle2 className="choice-check" />}<ClipboardList /><span><strong>Last 10 studies</strong><small>{recent} available · Wrong cards recently</small></span>
            </button>
            <div
              className={'study-choice-card review-choice slow-review-choice' + (p.reviewMode === 'slowest' ? ' selected' : '')}
              role="radio"
              tabIndex={0}
              aria-checked={p.reviewMode === 'slowest'}
              onClick={() => chooseReview('slowest')}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  chooseReview('slowest')
                }
              }}
            >
              {p.reviewMode === 'slowest' && <CheckCircle2 className="choice-check" />}
              <Gauge />
              <span><strong>Slowest characters</strong><small>{slowIds.length} available · Hiragana &amp; Katakana combined</small></span>
              <div className="slow-review-controls" onClick={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>
                <label className={p.slowReviewMode === 'top-30' ? 'active' : ''}>
                  <span>Top</span>
                  <input
                    aria-label="Number of slowest characters"
                    type="text"
                    inputMode="numeric"
                    value={slowTopInput}
                    onFocus={() => setPreferences({ reviewMode: 'slowest', slowReviewMode: 'top-30' })}
                    onChange={event => changeSlowTop(event.target.value)}
                    onBlur={commitSlowTop}
                  />
                </label>
                <label className={p.slowReviewMode === 'over-threshold' ? 'active' : ''}>
                  <span>Over</span>
                  <input
                    aria-label="Slow review threshold in seconds"
                    type="text"
                    inputMode="decimal"
                    value={slowThresholdInput}
                    onFocus={() => setPreferences({ reviewMode: 'slowest', slowReviewMode: 'over-threshold' })}
                    onChange={event => changeSlowThreshold(event.target.value)}
                    onBlur={commitSlowThreshold}
                  />
                  <span>s</span>
                </label>
              </div>
            </div>
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

  </main>

  {settings && <SettingsDialog onClose={() => setSettings(false)} />}
  {discard && <div className="modal-backdrop"><div className="dialog mini" role="alertdialog"><h2>Discard this session?</h2><p>Your answers from this unfinished session will be removed.</p><div className="dialog-actions"><button onClick={() => setDiscard(false)}>Keep it</button><button className="danger" onClick={() => { store.discardSession(); setDiscard(false) }}>Discard</button></div></div></div>}
  </Layout>
}
