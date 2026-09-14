import { allKana } from '../data/kana'
import type { ActiveStudySession, StudyPreferences, StudySession, StudySource } from '../types/kana'

export const shuffle = <T,>(items: T[]) => { const copy=[...items]; for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]} return copy }
export const createActiveSession = (ids: string[], preferences: StudyPreferences, source: StudySource, type: 'study'|'review'): ActiveStudySession => {
  const deck = (preferences.shuffled ? shuffle(ids) : ids).map(kanaId=>({kanaId,graded:false,grade:null,recognitionMs:null}))
  const waitingToStart = preferences.readyFirstCard
  return { id: crypto.randomUUID(), type, source, startedAt: Date.now(), deck, currentIndex: 0, flipped: false, reviewQueue: [], reviewIndex: 0, reviewPhase: false, reviewTimings: {}, timerRemainingMs: preferences.timerMs, timerStartedAt: preferences.timerMs && !waitingToStart ? Date.now() : null, shuffled: preferences.shuffled, reviewMistakesAtEnd: preferences.reviewMistakesAtEnd, sessionTimerMs: preferences.timerMs, recordSession: preferences.recordSession, waitingToStart, completed: false }
}
export const archiveSession = (active: ActiveStudySession): StudySession => {
  const map = new Map<string,{correctCount:number;wrongCount:number;recognitionTimes:number[]}>()
  active.deck.forEach(entry=>{ if(!entry.graded)return; const row=map.get(entry.kanaId)??{correctCount:0,wrongCount:0,recognitionTimes:[]}; row[entry.grade==='correct'?'correctCount':'wrongCount']++; if(entry.recognitionMs!=null) row.recognitionTimes.push(entry.recognitionMs+(active.reviewTimings[entry.kanaId]??0)); map.set(entry.kanaId,row) })
  return { id: active.id, type:active.type, source:active.source, startedAt:active.startedAt, finishedAt:Date.now(), shuffled:active.shuffled, timerMs:active.sessionTimerMs, reviewMistakesAtEnd:active.reviewMistakesAtEnd, deckOrder:active.deck.map(entry=>entry.kanaId), results:[...map].map(([kanaId,row])=>({kanaId,...row})) }
}
export const sourceIds = (set: StudyPreferences['characterSet']) => allKana.filter(k=>set==='both'||k.alphabet===set).map(k=>k.id)
