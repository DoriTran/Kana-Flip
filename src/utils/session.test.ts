import { describe, expect, it } from 'vitest'
import { allKana, hiragana, katakana } from '../data/kana'
import type { StudyPreferences, StudySession } from '../types/kana'
import { archiveSession, createActiveSession } from './session'
import { latestStudies, recentWrongCount, sessionSummary } from './stats'

const preferences: StudyPreferences = { characterSet:'hiragana', reviewMode:'none', reviewMistakesAtEnd:true, shuffled:false, lockNavigation:false, timerMs:null, recordSession:true, readyFirstCard:false, showKeyboardHints:true, reducedMotion:false }

describe('kana data',()=>{it('contains the basic 46 + 46 set with paired sounds',()=>{expect(hiragana).toHaveLength(46);expect(katakana).toHaveLength(46);expect(allKana).toHaveLength(92);expect(hiragana.map(k=>k.soundKey)).toEqual(katakana.map(k=>k.soundKey))})})
describe('sessions',()=>{it('archives deck order, primary scores and cumulative end-review timing',()=>{const active=createActiveSession(['hiragana-a'],preferences,'hiragana','study');active.deck[0]={...active.deck[0],graded:true,grade:'wrong',recognitionMs:500};active.reviewTimings['hiragana-a']=700;active.completed=true;const session=archiveSession(active,true,null);expect(session.deckOrder).toEqual(['hiragana-a']);expect(session.results[0]).toMatchObject({correctCount:0,wrongCount:1,recognitionTimes:[1200]});expect(sessionSummary(session).averageMs).toBe(1200)})
it('waits before starting the first card when ready mode is enabled',()=>{const active=createActiveSession(['hiragana-a'],{...preferences,timerMs:3000,readyFirstCard:true},'hiragana','study');expect(active.waitingToStart).toBe(true);expect(active.timerStartedAt).toBeNull()})
it('uses only the latest ten study sessions for mistakes',()=>{const sessions=Array.from({length:12},(_,i):StudySession=>({id:String(i),type:i===11?'review':'study',source:'hiragana',startedAt:i,finishedAt:i,shuffled:false,timerMs:null,reviewMistakesAtEnd:false,results:[{kanaId:'hiragana-a',correctCount:0,wrongCount:1,recognitionTimes:[]}]}));expect(latestStudies(sessions)).toHaveLength(10);expect(recentWrongCount(sessions,'hiragana-a')).toBe(10)})})
