import { ArrowLeft, ArrowUpDown, Check, Clock3, Flower, Star, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { kanaById } from '../data/kana'
import { useKanaStore } from '../stores/kanaStore'
import { archiveSession, sessionAddons } from '../utils/session'
import { formatTime, sessionSummary } from '../utils/stats'
import { canUsePageShortcut } from '../utils/pageShortcut'

type SortMode = 'wrong-slowest' | 'correct-fastest'

export function LessonReviewPage() {
  const nav = useNavigate()
  const { sessionId } = useParams()
  const [sortMode, setSortMode] = useState<SortMode>('wrong-slowest')
  const storedSession = useKanaStore(state => state.sessions.find(item => item.id === sessionId))
  const activeSession = useKanaStore(state => state.activeSession)
  const archiveActive = useKanaStore(state => state.archiveActive)
  const kanaProgress = useKanaStore(state => state.kanaProgress)
  const toggleStar = useKanaStore(state => state.toggleStar)
  const [activeSnapshot] = useState(() => {
    if (!activeSession || activeSession.id !== sessionId || !activeSession.completed) return null
    return archiveSession(activeSession)
  })
  const session = storedSession ?? activeSnapshot

  useEffect(() => {
    if (!storedSession && activeSnapshot) archiveActive()
  }, [storedSession, activeSnapshot, archiveActive])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || !canUsePageShortcut(event)) return
      event.preventDefault()
      nav('/')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [nav])

  if (!session) return <Navigate to="/" replace />

  const summary = sessionSummary(session)
  const addons = sessionAddons(session)
  const sourceName = session.source === 'addons' ? 'Add-ons' : session.source[0].toUpperCase() + session.source.slice(1)
  const lessonName = [sourceName, addons.includeVoiced && 'Voiced', addons.includeYoon && 'Yōon'].filter(Boolean).join(' + ')
  const order = session.deckOrder?.length ? session.deckOrder : session.results.map(result => result.kanaId)
  const resultById = new Map(session.results.map(result => [result.kanaId, result]))
  const cards = order.flatMap((kanaId, originalIndex) => {
    const kana = kanaById[kanaId]
    const result = resultById.get(kanaId)
    if (!kana || !result) return []
    const correct = result.correctCount > 0 && result.wrongCount === 0
    return [{ kanaId, originalIndex, kana, correct, time: result.recognitionTimes[0] ?? null }]
  }).sort((a, b) => {
    if (a.correct !== b.correct) {
      return sortMode === 'wrong-slowest' ? (a.correct ? 1 : -1) : (a.correct ? -1 : 1)
    }
    const aTime = a.time ?? (sortMode === 'wrong-slowest' ? -Infinity : Infinity)
    const bTime = b.time ?? (sortMode === 'wrong-slowest' ? -Infinity : Infinity)
    const timeOrder = sortMode === 'wrong-slowest' ? bTime - aTime : aTime - bTime
    return timeOrder || a.originalIndex - b.originalIndex
  })

  return <Layout>
    <main className="lesson-review-page">
      <div className="review-page-toolbar">
        <button className="review-back" onClick={() => nav(-1)}><ArrowLeft /> Back</button>
        <button
          className="review-sort-button"
          onClick={() => setSortMode(mode => mode === 'wrong-slowest' ? 'correct-fastest' : 'wrong-slowest')}
          aria-pressed={sortMode === 'correct-fastest'}
        >
          <ArrowUpDown /> {sortMode === 'wrong-slowest' ? 'Wrong · slowest first' : 'Correct · fastest first'}
        </button>
      </div>
      <header className="review-header">
        <Flower />
        <div>
          <p className="eyebrow">Lesson review</p>
          <div className='review-title-row'>
            <h1>{session.type === 'review' ? 'Review Session' : lessonName + ' Lesson'}</h1>
          </div>
          <p>{new Date(session.finishedAt).toLocaleString()} · {summary.correct}/{summary.total} correct · {summary.accuracy.toFixed(1)}%</p>
        </div>
      </header>
      <div className="review-lesson-grid">
        {cards.map(({ kanaId, kana, correct, time }, index) =>
          <article className={'lesson-kana-card ' + (correct ? 'was-correct' : 'was-wrong')} key={kanaId + '-' + index}>
            <button className={'star-button ' + (kanaProgress[kanaId]?.starred ? 'starred' : '')} onClick={() => toggleStar(kanaId)} aria-label={kanaProgress[kanaId]?.starred ? 'Unstar kana' : 'Star kana'} aria-pressed={!!kanaProgress[kanaId]?.starred}><Star /></button>
            <span className="lesson-number">{index + 1}</span>
            <span className="kana-char">{kana.character}</span>
            <b>{kana.alphabet === 'katakana' ? kana.romaji[0].toUpperCase() + kana.romaji.slice(1) : kana.romaji}</b>
            <footer>
              <span className="lesson-grade">{correct ? <Check /> : <X />}{correct ? 'Correct' : 'Wrong'}</span>
              <span><Clock3 />{formatTime(time)}</span>
            </footer>
          </article>
        )}
      </div>
    </main>
  </Layout>
}
