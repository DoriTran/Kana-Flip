import { allKana } from '../data/kana'
import type { ActiveStudySession, StudyPreferences, StudySession, StudySource } from '../types/kana'

export const shuffle = <T,>(items: T[]) => { const copy=[...items]; for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]} return copy }
export const createActiveSession = (ids: string[], preferences: StudyPreferences, source: StudySource, type: 'study'|'review'): ActiveStudySession => {
  const deck = (preferences.shuffled ? shuffle(ids) : ids).map(kanaId=>({kanaId,graded:false,grade:null,recognitionMs:null}))
  const waitingToStart = preferences.readyFirstCard
  return { id: crypto.randomUUID(), type, source, startedAt: Date.now(), deck, currentIndex: 0, flipped: false, reviewQueue: [], reviewIndex: 0, reviewPhase: false, reviewTimings: {}, timerRemainingMs: preferences.timerMs, timerStartedAt: preferences.timerMs && !waitingToStart ? Date.now() : null, shuffled: preferences.shuffled, reviewMistakesAtEnd: preferences.reviewMistakesAtEnd, includeVoiced: preferences.includeVoiced, includeYoon: preferences.includeYoon, sessionTimerMs: preferences.timerMs, recordSession: preferences.recordSession, waitingToStart, completed: false }
}
export const archiveSession = (active: ActiveStudySession): StudySession => {
  const map = new Map<string,{correctCount:number;wrongCount:number;recognitionTimes:number[]}>()
  active.deck.forEach(entry=>{ if(!entry.graded)return; const row=map.get(entry.kanaId)??{correctCount:0,wrongCount:0,recognitionTimes:[]}; row[entry.grade==='correct'?'correctCount':'wrongCount']++; if(entry.recognitionMs!=null) row.recognitionTimes.push(entry.recognitionMs+(active.reviewTimings[entry.kanaId]??0)); map.set(entry.kanaId,row) })
  return { id: active.id, type:active.type, source:active.source, startedAt:active.startedAt, finishedAt:Date.now(), shuffled:active.shuffled, timerMs:active.sessionTimerMs, reviewMistakesAtEnd:active.reviewMistakesAtEnd, includeVoiced:active.includeVoiced, includeYoon:active.includeYoon, deckOrder:active.deck.map(entry=>entry.kanaId), results:[...map].map(([kanaId,row])=>({kanaId,...row})) }
}

export const sessionAddons = (session: Pick<StudySession, 'includeVoiced' | 'includeYoon' | 'deckOrder' | 'results'>) => {
  const ids = session.deckOrder ?? session.results.map(result => result.kanaId)
  const variants = ids.map(id => allKana.find(kana => kana.id === id)?.variant)
  return {
    includeVoiced: session.includeVoiced ?? variants.some(variant => variant === 'voiced' || variant === 'voiced-yoon'),
    includeYoon: session.includeYoon ?? variants.some(variant => variant === 'yoon' || variant === 'voiced-yoon'),
  }
}
const variantEnabled = (variant: (typeof allKana)[number]['variant'], includeVoiced: boolean, includeYoon: boolean) =>
  variant === 'basic' ||
  (variant === 'voiced' && includeVoiced) ||
  (variant === 'yoon' && includeYoon) ||
  (variant === 'voiced-yoon' && includeVoiced && includeYoon)

export const sourceIds = (
  set: StudyPreferences['characterSet'],
  includeVoiced = false,
  includeYoon = false,
) => allKana
  .filter(kana => (set === 'both' || kana.alphabet === set) && variantEnabled(kana.variant, includeVoiced, includeYoon))
  .map(kana => kana.id)
