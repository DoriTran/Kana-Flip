import { ArrowLeft, ArrowRight, BookOpenCheck, Check, HelpCircle, House, RotateCcw, Sparkles, Star, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { kanaById } from '../data/kana'
import { useKanaStore } from '../stores/kanaStore'
import { archiveSession, studyTitle } from '../utils/session'
import { currentAnswered, skipCount } from '../utils/studyFlow'
import { formatTime, sessionSummary } from '../utils/stats'

const isTextControl = (target: EventTarget | null) => target instanceof HTMLElement && !!target.closest('input, textarea, select, [contenteditable="true"]')

export function LearningPage() {
  const nav = useNavigate(), store = useKanaStore(), active = store.activeSession
  const [help, setHelp] = useState(false), [now, setNow] = useState(() => Date.now())
  const [starNotice, setStarNotice] = useState<{ cardId: string; sequence: number } | null>(null)
  const starNoticeSequence = useRef(0)
  const shownAt = useRef(0)
  const handledExpiry = useRef<string | null>(null)
  const cardId = active ? (active.phase === 'mistakes' ? active.reviewQueue[active.reviewIndex] : active.deck[active.currentIndex]?.kanaId) : null
  const entry = active && active.phase !== 'mistakes' ? active.deck[active.currentIndex] : null
  const resetClock = useCallback(() => { shownAt.current = performance.now() }, [])
  const grade = useCallback((answer: 'correct' | 'wrong') => {
    const session = store.activeSession
    if (!session || session.completed) return
    if (session.phase !== 'mistakes' && session.deck[session.currentIndex]?.graded) {
      if (store.preferences.allowRegrading) store.regrade(answer)
      return
    }
    store.grade(answer, Math.max(0, performance.now() - shownAt.current))
  }, [store])

  useEffect(resetClock, [cardId, active?.phase, active?.currentIndex, active?.reviewIndex, resetClock])
  useEffect(() => {
    if (!starNotice) return
    const timeout = window.setTimeout(() => setStarNotice(null), 1000)
    return () => window.clearTimeout(timeout)
  }, [starNotice])
  useEffect(() => {
    if (active?.timerStartedAt == null || active.timerRemainingMs == null || active.completed) return
    const timer = window.setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(timer)
  }, [active?.timerStartedAt, active?.timerRemainingMs, active?.completed])
  const remaining = active?.timerRemainingMs != null ? Math.max(0,active.timerRemainingMs - (active.timerStartedAt == null ? 0 : Math.max(0,now - active.timerStartedAt))) : null
  useEffect(() => {
    if (remaining == null || remaining > 0 || !active || active.completed || active.timerPaused || active.timerStartedAt == null || currentAnswered(active)) return
    const expiryKey = `${active.id}-${active.phase}-${active.phase === 'mistakes' ? active.reviewIndex : active.currentIndex}-${active.timerStartedAt}`
    if (handledExpiry.current === expiryKey) return
    handledExpiry.current = expiryKey
    grade('wrong')
  }, [remaining, active, grade])
  useEffect(() => {
    const visibility = () => { if (document.hidden) useKanaStore.getState().pauseTimer(); else { useKanaStore.getState().resumeTimer(); resetClock() } }
    const pagehide = () => useKanaStore.getState().pauseTimer()
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('pagehide', pagehide)
    if (!document.hidden) useKanaStore.getState().resumeTimer()
    return () => { document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', pagehide); pagehide() }
  }, [resetClock])
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTextControl(event.target) || help) return
      if (store.activeSession?.waitingToStart) { event.preventDefault(); store.beginSession(); resetClock(); return }
      const code = event.code
      if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS', 'KeyE', 'Enter'].includes(code)) event.preventDefault()
      if (code === 'Space') store.flip()
      else if ((code === 'Enter' || code === 'KeyE') && cardId) {
        if (!useKanaStore.getState().kanaProgress[cardId]?.starred) store.toggleStar(cardId)
        setStarNotice({ cardId, sequence: ++starNoticeSequence.current })
      }
      else if ((code === 'ArrowLeft' || code === 'KeyA') && !store.preferences.lockNavigation) store.navigate(-1)
      else if ((code === 'ArrowRight' || code === 'KeyD') && !store.preferences.lockNavigation) store.navigate(1)
      else if (code === 'ArrowUp' || code === 'KeyW') grade('correct')
      else if (code === 'ArrowDown' || code === 'KeyS') grade('wrong')
    }
    window.addEventListener('keydown', onKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true })
  }, [store, cardId, help, grade, resetClock])

  if (!active) return <Navigate to="/" replace />
  if (active.completed) return <ResultView />
  if (!cardId) return <Navigate to="/" replace />
  if (active.waitingToStart) return <div className={`learn-page ${store.preferences.reducedMotion ? 'reduced-motion' : ''}`}><header className="learn-top"><button onClick={() => nav('/')}><ArrowLeft /> Exit</button><span><b>Get ready</b><small>{studyTitle(active)}</small></span><div /></header><main className="ready-stage"><button className="ready-card" onClick={() => { store.beginSession(); resetClock() }}><Sparkles /><strong>Ready?</strong><span>Press any key or tap to begin</span></button></main></div>
  const kana = kanaById[cardId]
  const graded = active.deck.filter(item => item.graded)
  const correct = graded.filter(item => item.grade === 'correct').length
  const wrong = graded.filter(item => item.grade === 'wrong').length
  const skipped = skipCount(active)
  const canGrade = active.phase === 'mistakes' ? !currentAnswered(active) : !entry?.graded || store.preferences.allowRegrading
  const completedInPhase = active.phase === 'mistakes' ? active.reviewCompleted.length : graded.length
  const totalInPhase = active.phase === 'mistakes' ? active.reviewQueue.length : active.deck.length
  const progress = totalInPhase ? completedInPhase / totalInPhase : 0
  const count = `${completedInPhase} / ${totalInPhase}`
  const answer = kana.alphabet === 'katakana' ? kana.romaji[0].toUpperCase() + kana.romaji.slice(1) : kana.romaji
  const navigationLocked = store.preferences.lockNavigation
  const canNavigateBack = active.phase === 'mistakes' ? active.reviewCursor > 0 : active.lessonCursor > 0
  const canNavigateNext = true

  return <div className={`learn-page ${store.preferences.reducedMotion ? 'reduced-motion' : ''}`}>
    <header className="learn-top"><button onClick={() => nav('/')}><ArrowLeft /> Exit</button><span><b>{active.phase === 'mistakes' ? 'Review mistakes' : active.type === 'review' ? 'Review · ' + active.source.replace('-', ' ') : studyTitle(active)}</b></span><div><button className="icon-button" onClick={() => setHelp(true)} aria-label="Keyboard shortcuts"><HelpCircle /></button></div></header>
    <div className="progress-wrap"><div className="progress-rail"><i style={{ width: `${progress * 100}%` }} /></div><div className="progress-meta"><b>{count}</b><div className="progress-scores">{skipped > 0 && <span className="score skipped" aria-label={`${skipped} skipped cards`}>↷ {skipped}</span>}<span className="score good">✓ {correct}</span><span className="score bad">× {wrong}</span></div></div></div>
    {active.phase === 'mistakes' && <p className="review-label"><RotateCcw /> Review · {active.reviewQueue.length - active.reviewCompleted.length} cards to revisit</p>}
    <main className={`study-stage ${navigationLocked ? 'locked' : ''}`}>
      {!navigationLocked && <button className="side-nav" onClick={() => store.navigate(-1)} disabled={!canNavigateBack}><ArrowLeft /></button>}
      <div className="card-area"><button className={`flip-scene ${active.flipped ? 'is-flipped' : ''}`} onClick={store.flip} aria-label={`Flip card showing ${kana.character}`}><span key={`${active.reviewPhase ? 'review' : 'main'}-${active.reviewPhase ? active.reviewIndex : active.currentIndex}-${cardId}`} className="flip-card"><span className="card-face card-front"><span className="big-kana">{kana.character}</span></span><span className="card-face card-back"><strong className="big-romaji">{answer}</strong></span></span></button><p>Click or press Space to flip <span aria-hidden>↝</span></p>{remaining != null && <div key={`timer-${active.reviewPhase ? `review-${active.reviewIndex}` : `main-${active.currentIndex}`}-${cardId}`} className="timer-bar"><i style={{ width: `${Math.min(100, Math.max(0, remaining) / (active.sessionTimerMs ?? 1) * 100)}%` }} /></div>}</div>
      {!navigationLocked && <button className="side-nav" onClick={() => store.navigate(1)} disabled={!canNavigateNext}><ArrowRight /></button>}
    </main>
    <footer className="study-controls">{!navigationLocked && <button onClick={() => store.navigate(-1)} disabled={!canNavigateBack}><ArrowLeft /> Previous</button>}<button className="wrong" disabled={!canGrade} onClick={() => grade('wrong')}><X /> Wrong</button><div className="flip-action">{starNotice?.cardId === cardId && <span key={starNotice.sequence} className="star-feedback" role="status"><Star /> Star <Star /></span>}<button className="flip-control" onClick={store.flip}><RotateCcw /> Flip</button></div><button className="correct" disabled={!canGrade} onClick={() => grade('correct')}><Check /> Got it</button>{!navigationLocked && <button onClick={() => store.navigate(1)} disabled={!canNavigateNext}>Next <ArrowRight /></button>}</footer>
    {store.preferences.showKeyboardHints && <div className="keyboard-strip">{!navigationLocked && <span>A / ←</span>}<span>S / ↓</span><span>Space</span><span>W / ↑</span>{!navigationLocked && <span>D / →</span>}</div>}
    {help && <KeyboardHelp onClose={() => setHelp(false)} />}
  </div>
}

function KeyboardHelp({ onClose }: { onClose: () => void }) { return <div className="modal-backdrop"><div className="dialog keyboard-help" role="dialog" aria-modal="true"><div className="dialog-title"><h2>Keyboard shortcuts</h2><button className="icon-button" onClick={onClose}><X /></button></div><dl><dt>Space</dt><dd>Flip card</dd><dt>W / ↑</dt><dd>Correct</dd><dt>S / ↓</dt><dd>Wrong</dd><dt>A / ←</dt><dd>Previous</dd><dt>D / →</dt><dd>Next</dd><dt>E / Enter</dt><dd>Star card (unstar in Alphabet)</dd></dl></div></div> }
function ResultView() {
  const nav = useNavigate(), store = useKanaStore(), active = store.activeSession!
  const snapshot = archiveSession(active)
  const sum = sessionSummary(snapshot)
  const reviewLesson = () => nav(`/review/${active.id}`)
  return <div className="result-page"><div className="confetti">✿ · ⋆ · ❀</div><h1>Session Complete!</h1><p>Great work today! ♡</p><section className="result-card"><div className="result-primary"><span><strong>{sum.correct} / {sum.total}</strong>Correct</span><span><strong>{sum.accuracy.toFixed(1)}%</strong>Accuracy</span><span><strong>{sum.wrong}</strong>Mistakes</span></div><div className="result-times"><span><strong>{formatTime(sum.averageMs)}</strong>Average time</span><span><strong>{sum.fastest ? formatTime(sum.fastest.ms) : '—'}</strong>Fastest</span><span><strong>{sum.slowest ? formatTime(sum.slowest.ms) : '—'}</strong>Slowest</span></div></section><button className="primary result-action" onClick={reviewLesson}><BookOpenCheck /> Review lesson</button><button className="home-action" onClick={() => { store.archiveActive(); nav('/') }}><House /> Back to Home</button></div>
}
