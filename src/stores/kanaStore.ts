import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { allKana } from '../data/kana'
import type { ActiveStudySession, KanaProgress, StudyPreferences, StudySession, StudySource } from '../types/kana'
import { archiveSession, createActiveSession, sourceIds } from '../utils/session'
import { activateTimer, afterAnswer, currentAnswered, moveInPhase, settleTimer } from '../utils/studyFlow'
import { recentWrongCount, slowReviewIds } from '../utils/stats'

const defaults: StudyPreferences = { characterSet:'hiragana', includeVoiced:false, includeYoon:false, reviewMode:'none', slowReviewMode:'top-30', slowTopCount:30, slowThresholdMs:5000, reviewMistakesAtEnd:true, shuffled:true, lockNavigation:false, allowRegrading:false, timerMs:null, recordSession:true, readyFirstCard:false, showKeyboardHints:true, reducedMotion:false, confirmDiscard:false }
interface KanaState { preferences:StudyPreferences; kanaProgress:Record<string,KanaProgress>; sessions:StudySession[]; activeSession:ActiveStudySession|null; setPreferences:(patch:Partial<StudyPreferences>)=>void; startSession:(sourceOverride?:StudySource, idsOverride?:string[])=>boolean; beginSession:()=>void; discardSession:()=>void; deleteSession:(id:string)=>void; toggleStar:(id:string)=>void; flip:()=>void; navigate:(delta:number)=>void; grade:(grade:'correct'|'wrong',elapsedMs:number)=>void; regrade:(grade:'correct'|'wrong')=>void; addReviewTime:(kanaId:string,elapsedMs:number)=>void; archiveActive:()=>StudySession|null; reviewActiveMistakes:()=>boolean; pauseTimer:()=>void; resumeTimer:()=>void; clearAll:()=>void }
const progressFor=(id:string):KanaProgress=>({kanaId:id,starred:false,bestRecognitionMs:null,totalCorrect:0,totalWrong:0,lastStudiedAt:null})

const migrateActive=(active:ActiveStudySession,preferences:StudyPreferences):ActiveStudySession=>{
  const legacy=active as unknown as {phase?:string;skippedOrder?:number[]}
  const limit=active.sessionTimerMs??preferences.timerMs
  const phase=legacy.phase==='mistakes'||active.reviewPhase?'mistakes':'lesson'
  const currentElapsed=limit==null?0:Math.max(0,limit-(active.timerRemainingMs??limit))
  const reviewQueue=active.reviewQueue??[]
  const reviewCompleted=active.reviewCompleted??reviewQueue.slice(0,active.reviewIndex)
  const reviewElapsedMs={...active.reviewTimings,...active.reviewElapsedMs}
  if(phase==='mistakes'&&reviewQueue[active.reviewIndex]&&!reviewCompleted.includes(reviewQueue[active.reviewIndex])){
    reviewElapsedMs[reviewQueue[active.reviewIndex]]=Math.max(reviewElapsedMs[reviewQueue[active.reviewIndex]]??0,currentElapsed)
  }
  return{
    ...active,
    deck:active.deck.map((entry,index)=>({...entry,elapsedMs:entry.elapsedMs??(entry.graded?entry.recognitionMs??0:phase!=='mistakes'&&index===active.currentIndex?currentElapsed:0)})),
    phase,reviewQueue,reviewCompleted,reviewElapsedMs,
    lessonHistory:active.lessonHistory??(legacy.phase==='skipped'?[...active.deck.map((_,index)=>index),active.currentIndex]:active.deck.slice(0,active.currentIndex+1).map((_,index)=>index)),
    lessonCursor:active.lessonCursor??(legacy.phase==='skipped'?active.deck.length:active.currentIndex),
    lessonFrontier:active.lessonFrontier??(legacy.phase==='skipped'?active.deck.length-1:active.currentIndex),
    lessonSkipped:active.lessonSkipped??(legacy.skippedOrder??active.deck.flatMap((entry,index)=>index<active.currentIndex&&!entry.graded?[index]:[])),
    reviewHistory:active.reviewHistory??(phase==='mistakes'?active.reviewQueue.slice(0,active.reviewIndex+1).map((_,index)=>index):[]),
    reviewCursor:active.reviewCursor??active.reviewIndex,
    reviewFrontier:active.reviewFrontier??active.reviewIndex,
    reviewSkipped:active.reviewSkipped??[],
    shuffled:active.shuffled??preferences.shuffled,reviewMistakesAtEnd:active.reviewMistakesAtEnd??preferences.reviewMistakesAtEnd,
    includeVoiced:active.includeVoiced??preferences.includeVoiced??false,includeYoon:active.includeYoon??preferences.includeYoon??false,
    sessionTimerMs:limit,recordSession:active.recordSession??true,waitingToStart:active.waitingToStart??false,
    timerRemainingMs:limit==null?null:Math.max(0,active.timerRemainingMs??limit),timerStartedAt:null,timerPaused:true,
  }
}

export const useKanaStore=create<KanaState>()(persist((set,get)=>({
  preferences:defaults,kanaProgress:{},sessions:[],activeSession:null,
  setPreferences:patch=>set(s=>({preferences:{...s.preferences,...patch}})),
  startSession:(sourceOverride,idsOverride)=>{const s=get(),p=s.preferences; let source:StudySource=sourceOverride??(p.reviewMode==='none'?p.characterSet:p.reviewMode); let ids=idsOverride; if(!ids){ids=p.reviewMode==='starred'?allKana.filter(k=>s.kanaProgress[k.id]?.starred).map(k=>k.id):p.reviewMode==='recent-mistakes'?allKana.filter(k=>recentWrongCount(s.sessions,k.id)>0).map(k=>k.id):p.reviewMode==='slowest'?slowReviewIds(s.sessions,p.slowReviewMode,p.slowThresholdMs,p.slowTopCount):sourceIds(p.characterSet,p.includeVoiced,p.includeYoon)} if(!ids.length)return false; set({activeSession:createActiveSession(ids,p,source,p.reviewMode==='none'&&!sourceOverride?'study':'review')}); return true},
  beginSession:()=>set(s=>s.activeSession?.waitingToStart?{activeSession:activateTimer({...s.activeSession,startedAt:Date.now(),waitingToStart:false},Date.now())}:{}),
  discardSession:()=>set({activeSession:null}),deleteSession:id=>set(s=>({sessions:s.sessions.filter(session=>session.id!==id)})),toggleStar:id=>set(s=>({kanaProgress:{...s.kanaProgress,[id]:{...(s.kanaProgress[id]??progressFor(id)),starred:!(s.kanaProgress[id]?.starred??false)}}})),
  flip:()=>set(s=>s.activeSession&&!s.activeSession.completed?{activeSession:{...s.activeSession,flipped:!s.activeSession.flipped}}:{}),
  navigate:delta=>{
    const before=get().activeSession
    if(!before||before.completed||before.waitingToStart||get().preferences.lockNavigation)return
    if(before.sessionTimerMs!=null && !currentAnswered(before) && before.timerRemainingMs!=null && before.timerRemainingMs-(before.timerStartedAt==null?0:Date.now()-before.timerStartedAt)<=0){get().grade('wrong',before.sessionTimerMs);return}
    set(s=>{
      if(!s.activeSession)return{}
      const now=Date.now()
      let active=settleTimer(s.activeSession,now)
      const moved=moveInPhase(active,delta)
      if(moved===active)return{}
      active=moved
      return{activeSession:activateTimer(active,now)}
    })
  },
  grade:(grade,elapsedMs)=>set(s=>{
    const original=s.activeSession
    if(!original||original.completed||original.waitingToStart)return{}
    const now=Date.now()
    let active=settleTimer(original,now)
    const limit=active.sessionTimerMs
    if(active.phase==='mistakes'){
      const id=active.reviewQueue[active.reviewIndex]
      if(!id||active.reviewCompleted.includes(id))return{}
      const time=limit==null?Math.max(0,elapsedMs):Math.min(limit,active.reviewElapsedMs[id]??0)
      const reviewCompleted=[...active.reviewCompleted,id]
      const reviewTimings={...active.reviewTimings,[id]:time}
      const reviewElapsedMs={...active.reviewElapsedMs,[id]:time}
      active=afterAnswer({...active,reviewCompleted,reviewTimings,reviewElapsedMs,reviewSkipped:active.reviewSkipped.filter(index=>index!==active.reviewIndex),flipped:false,timerStartedAt:null})
      return{activeSession:activateTimer(active,now)}
    }
    const entry=active.deck[active.currentIndex]
    if(!entry||entry.graded)return{}
    const time=limit==null?Math.max(0,elapsedMs):Math.min(limit,entry.elapsedMs)
    const finalGrade=limit!=null&&time>=limit?'wrong':grade
    const deck=[...active.deck]
    deck[active.currentIndex]={...entry,graded:true,grade:finalGrade,recognitionMs:time,elapsedMs:time}
    const reviewQueue=finalGrade==='wrong'&&active.reviewMistakesAtEnd&&!active.reviewQueue.includes(entry.kanaId)
      ?[...active.reviewQueue,entry.kanaId]:active.reviewQueue
    const progress={...s.kanaProgress}
    if(active.type==='study'){
      const old=progress[entry.kanaId]??progressFor(entry.kanaId)
      progress[entry.kanaId]={...old,totalCorrect:old.totalCorrect+(finalGrade==='correct'?1:0),totalWrong:old.totalWrong+(finalGrade==='wrong'?1:0),lastStudiedAt:now,bestRecognitionMs:old.bestRecognitionMs==null||time<old.bestRecognitionMs?time:old.bestRecognitionMs}
    }
    active=afterAnswer({...active,deck,reviewQueue,lessonSkipped:active.lessonSkipped.filter(index=>index!==active.currentIndex),flipped:false,timerStartedAt:null})
    return{kanaProgress:progress,activeSession:activateTimer(active,now)}
  }),
  regrade:grade=>set(s=>{
    const active=s.activeSession
    if(!active||active.completed||active.reviewPhase||!s.preferences.allowRegrading)return{}
    const entry=active.deck[active.currentIndex]
    if(!entry?.graded||entry.grade===grade)return{}
    const deck=[...active.deck]
    deck[active.currentIndex]={...entry,grade}
    const reviewQueue=s.preferences.reviewMistakesAtEnd
      ? grade==='wrong' ? [...active.reviewQueue,entry.kanaId] : active.reviewQueue.filter(id=>id!==entry.kanaId)
      : active.reviewQueue
    const progress={...s.kanaProgress}
    if(active.type==='study'){
      const old=progress[entry.kanaId]??progressFor(entry.kanaId)
      progress[entry.kanaId]={
        ...old,
        totalCorrect:Math.max(0,old.totalCorrect+(grade==='correct'?1:-1)),
        totalWrong:Math.max(0,old.totalWrong+(grade==='wrong'?1:-1)),
      }
    }
    return{kanaProgress:progress,activeSession:{...active,deck,reviewQueue}}
  }),
  addReviewTime:(id,ms)=>set(s=>s.activeSession?{activeSession:{...s.activeSession,reviewTimings:{...s.activeSession.reviewTimings,[id]:(s.activeSession.reviewTimings[id]??0)+ms}}}:{}),
  archiveActive:()=>{const s=get();if(!s.activeSession||!s.activeSession.completed)return null;const archived=archiveSession(s.activeSession);set({sessions:s.activeSession.recordSession?[archived,...s.sessions]:s.sessions,activeSession:null});return archived},
  reviewActiveMistakes:()=>{const s=get(),a=s.activeSession;if(!a||!a.completed)return false;const ids=[...new Set(a.deck.filter(e=>e.grade==='wrong').map(e=>e.kanaId))];if(!ids.length)return false;const archived=archiveSession(a);set({sessions:a.recordSession?[archived,...s.sessions]:s.sessions,activeSession:createActiveSession(ids,{...s.preferences,reviewMode:'none'},'session-mistakes','review')});return true},
  pauseTimer:()=>set(s=>s.activeSession&&!s.activeSession.completed?{activeSession:{...settleTimer(s.activeSession,Date.now()),timerPaused:true}}:{}),
  resumeTimer:()=>{
    const active=get().activeSession
    if(!active||active.completed||active.waitingToStart)return
    if(active.sessionTimerMs!=null&&!currentAnswered(active)&&active.timerRemainingMs===0){get().grade('wrong',active.sessionTimerMs);return}
    set(s=>s.activeSession?{activeSession:activateTimer({...s.activeSession,timerPaused:false},Date.now())}:{})
  },
  clearAll:()=>set({preferences:defaults,kanaProgress:{},sessions:[],activeSession:null}),
}),{
  name:'kanaflip:v1',version:12,
  migrate:p=>{
    const state=p as KanaState
    const preferences={...defaults,...state.preferences}
    return{...state,preferences,activeSession:state.activeSession?migrateActive(state.activeSession,preferences):null}
  },
  merge:(persisted,current)=>{
    const state=persisted as Partial<KanaState>
    return{...current,...state,activeSession:state.activeSession?{...state.activeSession,timerStartedAt:null,timerPaused:true}:null}
  },
  partialize:s=>({preferences:s.preferences,kanaProgress:s.kanaProgress,sessions:s.sessions,activeSession:s.activeSession}),
}))
