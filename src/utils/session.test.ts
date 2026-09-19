import { describe, expect, it } from 'vitest'
import { allKana, hiragana, katakana } from '../data/kana'
import type { StudyPreferences, StudySession } from '../types/kana'
import { archiveSession, createActiveSession, sourceIds, studyTitle } from './session'
import { latestStudies, recentWrongCount, sessionSummary, slowReviewIds } from './stats'

describe('Learn titles',()=>{
  it('shows add-on groups as the primary title',()=>{
    expect(studyTitle({source:'addons',includeVoiced:true,includeYoon:false})).toBe('Voiced')
    expect(studyTitle({source:'addons',includeVoiced:false,includeYoon:true})).toBe('Yōon')
    expect(studyTitle({source:'addons',includeVoiced:true,includeYoon:true})).toBe('Voiced + Yōon')
  })
  it('includes add-ons after the base set',()=>{
    expect(studyTitle({source:'hiragana',includeVoiced:true,includeYoon:true})).toBe('Hiragana + Voiced + Yōon')
    expect(studyTitle({source:'katakana',includeVoiced:true,includeYoon:false})).toBe('Katakana + Voiced')
    expect(studyTitle({source:'both',includeVoiced:false,includeYoon:false})).toBe('Both')
  })
})

const preferences: StudyPreferences = { characterSet:'hiragana', includeVoiced:false, includeYoon:false, reviewMode:'none', slowReviewMode:'top-30', slowTopCount:30, slowThresholdMs:5000, reviewMistakesAtEnd:true, shuffled:false, lockNavigation:false, allowRegrading:false, timerMs:null, recordSession:true, readyFirstCard:false, showKeyboardHints:true, reducedMotion:false, confirmDiscard:false }

describe('kana data',()=>{
  it('contains 104 entries per alphabet with paired sounds',()=>{
    expect(hiragana).toHaveLength(104)
    expect(katakana).toHaveLength(104)
    expect(allKana).toHaveLength(208)
    expect(hiragana.map(k=>k.soundKey)).toEqual(katakana.map(k=>k.soundKey))
  })
  it('builds exact source counts for every add-on combination',()=>{
    expect(sourceIds('hiragana')).toHaveLength(46)
    expect(sourceIds('hiragana',true,false)).toHaveLength(71)
    expect(sourceIds('hiragana',false,true)).toHaveLength(67)
    expect(sourceIds('hiragana',true,true)).toHaveLength(104)
    expect(sourceIds('both')).toHaveLength(92)
    expect(sourceIds('both',true,false)).toHaveLength(142)
    expect(sourceIds('both',false,true)).toHaveLength(134)
    expect(sourceIds('both',true,true)).toHaveLength(208)
    expect(sourceIds('addons',true,false)).toHaveLength(50)
    expect(sourceIds('addons',false,true)).toHaveLength(42)
    expect(sourceIds('addons',true,true)).toHaveLength(116)
    for (const id of sourceIds('addons',true,true)) {
      expect(allKana.find(kana => kana.id === id)?.variant).not.toBe('basic')
    }
    expect(sourceIds('addons',true,true).some(id => id.startsWith('hiragana-'))).toBe(true)
    expect(sourceIds('addons',true,true).some(id => id.startsWith('katakana-'))).toBe(true)
  })
  it('requires the matching add-ons for voiced, Yōon and voiced Yōon kana',()=>{
    expect(sourceIds('hiragana')).toContain('hiragana-a')
    expect(sourceIds('hiragana')).not.toContain('hiragana-ga')
    expect(sourceIds('hiragana',true,false)).toContain('hiragana-ga')
    expect(sourceIds('hiragana',false,true)).toContain('hiragana-kya')
    expect(sourceIds('hiragana',false,true)).not.toContain('hiragana-gya')
    expect(sourceIds('hiragana',true,true)).toContain('hiragana-gya')
    expect(sourceIds('addons',false,true)).not.toContain('hiragana-gya')
    expect(sourceIds('addons',true,true)).toContain('hiragana-gya')
  })
})
describe('sessions',()=>{it('archives deck order, primary scores and cumulative end-review timing',()=>{const active=createActiveSession(['hiragana-a'],preferences,'hiragana','study');active.deck[0]={...active.deck[0],graded:true,grade:'wrong',recognitionMs:500};active.reviewTimings['hiragana-a']=700;active.completed=true;const session=archiveSession(active);expect(session.deckOrder).toEqual(['hiragana-a']);expect(session.results[0]).toMatchObject({correctCount:0,wrongCount:1,recognitionTimes:[1200]});expect(sessionSummary(session).averageMs).toBe(1200)})
it('waits before starting the first card when ready mode is enabled',()=>{const active=createActiveSession(['hiragana-a'],{...preferences,timerMs:3000,readyFirstCard:true},'hiragana','study');expect(active.waitingToStart).toBe(true);expect(active.timerStartedAt).toBeNull()})
it('uses only the latest ten study sessions for mistakes',()=>{const sessions=Array.from({length:12},(_,i):StudySession=>({id:String(i),type:i===11?'review':'study',source:'hiragana',startedAt:i,finishedAt:i,shuffled:false,timerMs:null,reviewMistakesAtEnd:false,results:[{kanaId:'hiragana-a',correctCount:0,wrongCount:1,recognitionTimes:[]}]}));expect(latestStudies(sessions)).toHaveLength(10);expect(recentWrongCount(sessions,'hiragana-a')).toBe(10)})
it('builds slow review decks from average study timings across both alphabets',()=>{const sessions:StudySession[]=[{id:'study',type:'study',source:'both',startedAt:0,finishedAt:1,shuffled:false,timerMs:null,reviewMistakesAtEnd:false,results:[{kanaId:'hiragana-a',correctCount:1,wrongCount:0,recognitionTimes:[6000,4000]},{kanaId:'katakana-a',correctCount:1,wrongCount:0,recognitionTimes:[7000]}]},{id:'review',type:'review',source:'slowest',startedAt:2,finishedAt:3,shuffled:false,timerMs:null,reviewMistakesAtEnd:false,results:[{kanaId:'hiragana-i',correctCount:1,wrongCount:0,recognitionTimes:[9000]}]}];expect(slowReviewIds(sessions,'top-30',5000)).toEqual(['katakana-a','hiragana-a']);expect(slowReviewIds(sessions,'over-threshold',5000)).toEqual(['katakana-a'])})})
