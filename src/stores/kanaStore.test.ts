import { afterEach, describe, expect, it } from 'vitest'
import { useKanaStore } from './kanaStore'
import { archiveSession, sourceIds } from '../utils/session'

afterEach(() => useKanaStore.getState().clearAll())

describe('changing answered cards', () => {
  it('updates the score and mistake review without recording another answer', () => {
    const store = useKanaStore.getState()
    store.setPreferences({
      allowRegrading: true,
      shuffled: false,
      timerMs: null,
      reviewMistakesAtEnd: true,
    })
    expect(store.startSession(undefined, ['hiragana-a', 'hiragana-i'])).toBe(true)
    useKanaStore.getState().grade('wrong', 1200)
    expect(useKanaStore.getState().activeSession?.currentIndex).toBe(1)
    useKanaStore.getState().navigate(-1)
    useKanaStore.getState().regrade('correct')
    const state = useKanaStore.getState()
    expect(state.activeSession?.deck[0]).toMatchObject({ graded: true, grade: 'correct', recognitionMs: 1200 })
    expect(state.activeSession?.reviewQueue).toEqual([])
    expect(state.kanaProgress['hiragana-a']).toMatchObject({ totalCorrect: 1, totalWrong: 0 })
    expect(state.activeSession?.currentIndex).toBe(0)
    state.regrade('wrong')
    expect(useKanaStore.getState().activeSession?.reviewQueue).toEqual(['hiragana-a'])
    expect(useKanaStore.getState().kanaProgress['hiragana-a']).toMatchObject({ totalCorrect: 0, totalWrong: 1 })
  })

  it('keeps answered cards locked when the setting is off', () => {
    const store = useKanaStore.getState()
    store.setPreferences({ allowRegrading: false, shuffled: false, timerMs: null })
    store.startSession(undefined, ['hiragana-a', 'hiragana-i'])
    useKanaStore.getState().grade('wrong', 500)
    useKanaStore.getState().navigate(-1)
    useKanaStore.getState().regrade('correct')
    expect(useKanaStore.getState().activeSession?.deck[0].grade).toBe('wrong')
  })
})

describe('Add-ons-only session', () => {
  it('saves its own source and checkbox snapshot for History and Lesson Review', () => {
    const store = useKanaStore.getState()
    store.setPreferences({ characterSet: 'addons', includeVoiced: true, includeYoon: false, shuffled: false })
    expect(store.startSession()).toBe(true)
    const active = useKanaStore.getState().activeSession!
    expect(active).toMatchObject({ type: 'study', source: 'addons', includeVoiced: true, includeYoon: false })
    expect(active.deck.map(entry => entry.kanaId)).toEqual(sourceIds('addons', true, false))
    expect(archiveSession(active)).toMatchObject({ source: 'addons', includeVoiced: true, includeYoon: false })
  })
})
