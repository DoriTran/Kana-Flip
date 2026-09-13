import type { Kana, StudySession } from '../types/kana'

export const latestStudies = (sessions: StudySession[]) => sessions.filter(s => s.type === 'study').sort((a,b) => b.finishedAt-a.finishedAt).slice(0,10)
export const recentWrongCount = (sessions: StudySession[], kanaId: string) => latestStudies(sessions).reduce((sum,s) => sum + (s.results.find(r => r.kanaId === kanaId)?.wrongCount ?? 0), 0)
export const sessionSummary = (session: StudySession) => {
  const correct = session.results.reduce((n,r)=>n+r.correctCount,0), wrong = session.results.reduce((n,r)=>n+r.wrongCount,0)
  const times = session.results.flatMap(r=>r.recognitionTimes.map(ms=>({kanaId:r.kanaId,ms})))
  const total = correct + wrong
  return { correct, wrong, total, accuracy: total ? correct/total*100 : 0, averageMs: times.length ? times.reduce((n,t)=>n+t.ms,0)/times.length : 0, fastest: times.length ? [...times].sort((a,b)=>a.ms-b.ms)[0] : null, slowest: times.length ? [...times].sort((a,b)=>b.ms-a.ms)[0] : null }
}
export const needsPracticeScore = (kana: Kana, sessions: StudySession[], best: number | null) => recentWrongCount(sessions,kana.id)*1_000_000 + (best ?? 0)
export const formatTime = (ms: number | null) => ms == null ? '—' : `${(ms/1000).toFixed(ms < 1000 ? 2 : 1)}s`
