import { ArrowLeft, Check, Clock3, Flower, X } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { kanaById } from '../data/kana'
import { useKanaStore } from '../stores/kanaStore'
import { archiveSession } from '../utils/session'
import { formatTime, sessionSummary } from '../utils/stats'

export function LessonReviewPage() {
  const nav = useNavigate()
  const { sessionId } = useParams()
  const storedSession = useKanaStore(state => state.sessions.find(item => item.id === sessionId))
  const activeSession = useKanaStore(state => state.activeSession)
  const archiveActive = useKanaStore(state => state.archiveActive)
  const activeSnapshot = useMemo(() => {
    if (!activeSession || activeSession.id !== sessionId || !activeSession.completed) return null
    const preferences = useKanaStore.getState().preferences
    return archiveSession(activeSession, preferences.reviewMistakesAtEnd, preferences.timerMs)
  }, [activeSession, sessionId])
  const session = storedSession ?? activeSnapshot
  useEffect(() => {
    if (!storedSession && activeSnapshot) archiveActive()
  }, [storedSession, activeSnapshot, archiveActive])
  if (!session) return <Navigate to="/" replace />
  const summary = sessionSummary(session)
  const order = session.deckOrder?.length ? session.deckOrder : session.results.map(result => result.kanaId)
  const resultById = new Map(session.results.map(result => [result.kanaId, result]))

  return <Layout>
    <main className="lesson-review-page">
      <button className="review-back" onClick={() => nav(-1)}><ArrowLeft /> Back</button>
      <header className="review-header"><Flower /><div><p className="eyebrow">Lesson review</p><h1>{session.type === 'review' ? 'Review Session' : `${session.source[0].toUpperCase()}${session.source.slice(1)} Lesson`}</h1><p>{new Date(session.finishedAt).toLocaleString()} · {summary.correct}/{summary.total} correct · {summary.accuracy.toFixed(1)}%</p></div></header>
      <div className="review-lesson-grid">{order.map((kanaId, index) => {
        const kana = kanaById[kanaId], result = resultById.get(kanaId)
        if (!kana || !result) return null
        const correct = result.correctCount > 0 && result.wrongCount === 0
        const time = result.recognitionTimes[0] ?? null
        return <article className={`lesson-kana-card ${correct ? 'was-correct' : 'was-wrong'}`} key={`${kanaId}-${index}`}>
          <span className="lesson-number">{index + 1}</span><span className="kana-char">{kana.character}</span><b>{kana.alphabet === 'katakana' ? kana.romaji[0].toUpperCase() + kana.romaji.slice(1) : kana.romaji}</b>
          <footer><span className="lesson-grade">{correct ? <Check /> : <X />}{correct ? 'Correct' : 'Wrong'}</span><span><Clock3 />{formatTime(time)}</span></footer>
        </article>
      })}</div>
    </main>
  </Layout>
}
