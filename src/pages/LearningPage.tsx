import { ArrowLeft, ArrowRight, BookOpenCheck, Check, HelpCircle, House, RotateCcw, Sparkles, Star, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { kanaById } from '../data/kana'
import { useKanaStore } from '../stores/kanaStore'
import { archiveSession } from '../utils/session'
import { formatTime, sessionSummary } from '../utils/stats'

const isTextControl = (target: EventTarget | null) => target instanceof HTMLElement && !!target.closest('input, textarea, select, [contenteditable="true"]')

export function LearningPage() {
  const nav = useNavigate(), store = useKanaStore(), active = store.activeSession
  const [help, setHelp] = useState(false), [now, setNow] = useState(0)
  const shownAt = useRef(0)
  const handledExpiry = useRef<string | null>(null)
  const cardId = active ? (active.reviewPhase ? active.reviewQueue[active.reviewIndex] : active.deck[active.currentIndex]?.kanaId) : null
  const entry = active && !active.reviewPhase ? active.deck[active.currentIndex] : null
  const resetClock = useCallback(() => { shownAt.current = performance.now() }, [])
  const grade = useCallback((answer: 'correct' | 'wrong') => {
    const session = store.activeSession
    if (!session || session.completed || (!session.reviewPhase && session.deck[session.currentIndex]?.graded)) return
    store.grade(answer, Math.max(0, performance.now() - shownAt.current))
  }, [store])

  useEffect(resetClock, [cardId, resetClock])
  useEffect(() => {
    if (!active?.timerStartedAt || active.timerRemainingMs == null || active.completed) return
    const timer = window.setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(timer)
  }, [active?.timerStartedAt, active?.timerRemainingMs, active?.completed])
  const remaining = active?.timerRemainingMs != null ? active.timerRemainingMs - (active.timerStartedAt ? now - active.timerStartedAt : 0) : null
  useEffect(() => {
    if (remaining == null || remaining > 0 || active?.completed) return
    if (!active?.reviewPhase && entry?.graded) return
    const expiryKey = `${active?.id}-${active?.reviewPhase ? `review-${active.reviewIndex}` : `main-${active?.currentIndex}`}-${active?.timerStartedAt}`
    if (handledExpiry.current === expiryKey) return
    handledExpiry.current = expiryKey
    grade('wrong')
  }, [remaining, active?.completed, active?.reviewPhase, active?.reviewIndex, active?.currentIndex, active?.id, active?.timerStartedAt, entry?.graded, grade])
  useEffect(() => {
    const visibility = () => { if (document.hidden) store.pauseTimer(); else { store.resumeTimer(); resetClock() } }
    document.addEventListener('visibilitychange', visibility)
    return () => document.removeEventListener('visibilitychange', visibility)
  }, [store, resetClock])
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTextControl(event.target) || help) return
      if (store.activeSession?.waitingToStart) { event.preventDefault(); store.beginSession(); resetClock(); return }
      const code = event.code
      if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS', 'Enter'].includes(code)) event.preventDefault()
      if (code === 'Space') store.flip()
      else if (code === 'Enter' && cardId) store.toggleStar(cardId)
      else if ((code === 'ArrowLeft' || code === 'KeyA') && !store.preferences.lockNavigation && store.preferences.timerMs == null) store.navigate(-1)
      else if ((code === 'ArrowRight' || code === 'KeyD') && !store.preferences.lockNavigation && store.preferences.timerMs == null) store.navigate(1)
      else if (code === 'ArrowUp' || code === 'KeyW') grade('correct')
      else if (code === 'ArrowDown' || code === 'KeyS') grade('wrong')
    }
    window.addEventListener('keydown', onKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true })
  }, [store, cardId, help, grade, resetClock])

  if (!active || !cardId) return <Navigate to="/" replace />
  if (active.completed) return <ResultView />
  if (active.waitingToStart) return <div className={`learn-page ${store.preferences.reducedMotion ? 'reduced-motion' : ''}`}><header className="learn-top"><button onClick={() => nav('/')}><ArrowLeft /> Exit</button><span><b>Get ready</b><small>{active.source.replace('-', ' ')}</small></span><div /></header><main className="ready-stage"><button className="ready-card" onClick={() => { store.beginSession(); resetClock() }}><Sparkles /><strong>Ready?</strong><span>Press any key or tap to begin</span></button></main></div>
  const kana = kanaById[cardId]
  const graded = active.deck.filter(item => item.graded)
  const correct = graded.filter(item => item.grade === 'correct').length
  const wrong = graded.filter(item => item.grade === 'wrong').length
  const canGrade = active.reviewPhase || !entry?.graded
  const progress = active.reviewPhase ? active.reviewIndex / active.reviewQueue.length : graded.length / active.deck.length
  const count = active.reviewPhase ? `${active.reviewIndex + 1} / ${active.reviewQueue.length}` : `${graded.length} / ${active.deck.length}`
  const answer = kana.alphabet === 'katakana' ? kana.romaji[0].toUpperCase() + kana.romaji.slice(1) : kana.romaji
  const navigationLocked = store.preferences.lockNavigation || store.preferences.timerMs != null

  return <div className={`learn-page ${store.preferences.reducedMotion ? 'reduced-motion' : ''}`}>
    <header className="learn-top"><button onClick={() => nav('/')}><ArrowLeft /> Exit</button><span><b>{active.reviewPhase ? 'End Review' : active.type === 'review' ? 'Review' : 'Study'}</b><small>{active.source.replace('-', ' ')}</small></span><div><button className="icon-button" onClick={() => setHelp(true)} aria-label="Keyboard shortcuts"><HelpCircle /></button></div></header>
    <div className="progress-wrap"><div className="progress-rail"><i style={{ width: `${progress * 100}%` }} /></div><b>{count}</b><span className="score good">✓ {correct}</span><span className="score bad">× {wrong}</span></div>
    {active.reviewPhase && <p className="review-label"><RotateCcw /> Review · {active.reviewQueue.length - active.reviewIndex} cards to revisit</p>}
    <main className={`study-stage ${navigationLocked ? 'locked' : ''}`}>
      {!navigationLocked && <button className="side-nav" onClick={() => store.navigate(-1)} disabled={active.reviewPhase || active.currentIndex === 0}><ArrowLeft /></button>}
      <div className="card-area"><button className={`flip-scene ${active.flipped ? 'is-flipped' : ''}`} onClick={store.flip} aria-label={`Flip card showing ${kana.character}`}><span key={`${active.reviewPhase ? 'review' : 'main'}-${active.reviewPhase ? active.reviewIndex : active.currentIndex}-${cardId}`} className="flip-card"><span className="card-face card-front"><span className="big-kana">{kana.character}</span></span><span className="card-face card-back"><strong className="big-romaji">{answer}</strong></span></span></button><p>Click or press Space to flip <span aria-hidden>↝</span></p>{remaining != null && <div key={`timer-${active.reviewPhase ? `review-${active.reviewIndex}` : `main-${active.currentIndex}`}-${cardId}`} className="timer-bar"><i style={{ width: `${Math.min(100, Math.max(0, remaining) / (store.preferences.timerMs ?? 1) * 100)}%` }} /></div>}</div>
      {!navigationLocked && <button className="side-nav" onClick={() => store.navigate(1)} disabled={active.reviewPhase || active.currentIndex === active.deck.length - 1}><ArrowRight /></button>}
    </main>
    <footer className="study-controls">{!navigationLocked && <button onClick={() => store.navigate(-1)} disabled={active.reviewPhase || active.currentIndex === 0}><ArrowLeft /> Previous</button>}<button className="wrong" disabled={!canGrade} onClick={() => grade('wrong')}><X /> Wrong</button><button className="flip-control" onClick={store.flip}><RotateCcw /> Flip</button><button className="correct" disabled={!canGrade} onClick={() => grade('correct')}><Check /> Got it</button>{!navigationLocked && <button onClick={() => store.navigate(1)} disabled={active.reviewPhase || active.currentIndex === active.deck.length - 1}>Next <ArrowRight /></button>}</footer>
    {store.preferences.showKeyboardHints && <div className="keyboard-strip">{!navigationLocked && <span>A / ←</span>}<span>S / ↓</span><span>Space</span><span>W / ↑</span>{!navigationLocked && <span>D / →</span>}</div>}
    {help && <KeyboardHelp onClose={() => setHelp(false)} />}
  </div>
}

function KeyboardHelp({ onClose }: { onClose: () => void }) { return <div className="modal-backdrop"><div className="dialog keyboard-help" role="dialog" aria-modal="true"><div className="dialog-title"><h2>Keyboard shortcuts</h2><button className="icon-button" onClick={onClose}><X /></button></div><dl><dt>Space</dt><dd>Flip card</dd><dt>W / ↑</dt><dd>Correct</dd><dt>S / ↓</dt><dd>Wrong</dd><dt>A / ←</dt><dd>Previous</dd><dt>D / →</dt><dd>Next</dd><dt>Enter</dt><dd>Star / unstar</dd></dl></div></div> }
function ResultView() {
  const nav = useNavigate(), store = useKanaStore(), active = store.activeSession!
  const snapshot = archiveSession(active, store.preferences.reviewMistakesAtEnd, store.preferences.timerMs)
  const sum = sessionSummary(snapshot)
  const reviewLesson = () => nav(`/review/${active.id}`)
  return <div className="result-page"><div className="confetti">✿ · ⋆ · ❀</div><h1>Session Complete!</h1><p>Great work today! ♡</p><section className="result-card"><div className="result-primary"><span><strong>{sum.correct} / {sum.total}</strong>Correct</span><span><strong>{sum.accuracy.toFixed(1)}%</strong>Accuracy</span><span><strong>{sum.wrong}</strong>Mistakes</span></div><div className="result-times"><span><strong>{formatTime(sum.averageMs)}</strong>Average time</span><span><strong>{sum.fastest ? formatTime(sum.fastest.ms) : '—'}</strong>Fastest</span><span><strong>{sum.slowest ? formatTime(sum.slowest.ms) : '—'}</strong>Slowest</span></div></section><button className="primary result-action" onClick={reviewLesson}><BookOpenCheck /> Review lesson</button><button className="home-action" onClick={() => { store.archiveActive(); nav('/') }}><House /> Back to Home</button></div>
}
