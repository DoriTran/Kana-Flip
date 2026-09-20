import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useKanaStore } from './kanaStore'
import { archiveSession } from '../utils/session'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(10_000)
})

afterEach(() => {
  useKanaStore.getState().clearAll()
  vi.useRealTimers()
})

describe('timed card navigation', () => {
  it('pauses an unanswered card and freezes an answered card at its remaining time', () => {
    const store = useKanaStore.getState()
    store.setPreferences({ timerMs: 5000, shuffled: false, reviewMistakesAtEnd: false })
    store.startSession(undefined, ['hiragana-a', 'hiragana-i'])
    vi.advanceTimersByTime(1800)
    store.navigate(1)
    expect(useKanaStore.getState().activeSession).toMatchObject({ currentIndex: 1, timerRemainingMs: 5000 })
    expect(useKanaStore.getState().activeSession?.deck[0].elapsedMs).toBe(1800)

    vi.advanceTimersByTime(1000)
    store.navigate(-1)
    expect(useKanaStore.getState().activeSession).toMatchObject({ currentIndex: 0, timerRemainingMs: 3200 })
    vi.advanceTimersByTime(500)
    store.grade('correct', 0)
    expect(useKanaStore.getState().activeSession?.deck[0]).toMatchObject({ grade: 'correct', recognitionMs: 2300 })
    store.navigate(-1)
    expect(useKanaStore.getState().activeSession).toMatchObject({ currentIndex: 0, timerRemainingMs: 2700, timerStartedAt: null })
    vi.advanceTimersByTime(3000)
    expect(useKanaStore.getState().activeSession?.timerRemainingMs).toBe(2700)
  })

  it('pauses on tab hide and resumes the same card without counting hidden time', () => {
    const store = useKanaStore.getState()
    store.setPreferences({ timerMs: 5000 })
    store.startSession(undefined, ['hiragana-a'])
    vi.advanceTimersByTime(1200)
    store.pauseTimer()
    expect(useKanaStore.getState().activeSession).toMatchObject({ timerRemainingMs: 3800, timerStartedAt: null, timerPaused: true })
    vi.advanceTimersByTime(9000)
    store.resumeTimer()
    expect(useKanaStore.getState().activeSession?.timerRemainingMs).toBe(3800)
    vi.advanceTimersByTime(300)
    store.grade('correct', 0)
    expect(useKanaStore.getState().activeSession?.deck[0].recognitionMs).toBe(1500)
  })

  it('keeps a paused card timer through localStorage rehydration', async () => {
    const store = useKanaStore.getState()
    store.setPreferences({ timerMs: 5000 })
    store.startSession(undefined, ['hiragana-a'])
    vi.advanceTimersByTime(1200)
    store.pauseTimer()
    const saved = localStorage.getItem('kanaflip:v1')!
    store.resumeTimer()
    localStorage.setItem('kanaflip:v1', saved)
    await useKanaStore.persist.rehydrate()
    expect(useKanaStore.getState().activeSession).toMatchObject({ timerRemainingMs: 3800, timerStartedAt: null, timerPaused: true })
    store.resumeTimer()
    vi.advanceTimersByTime(300)
    store.grade('correct', 0)
    expect(useKanaStore.getState().activeSession?.deck[0].recognitionMs).toBe(1500)
  })

  it('keeps a graded card timer frozen when Change answers is used', () => {
    const store = useKanaStore.getState()
    store.setPreferences({ timerMs: 5000, shuffled: false, allowRegrading: true })
    store.startSession(undefined, ['hiragana-a', 'hiragana-i'])
    vi.advanceTimersByTime(1000)
    store.grade('wrong', 0)
    store.navigate(-1)
    expect(useKanaStore.getState().activeSession).toMatchObject({ timerRemainingMs: 4000, timerStartedAt: null })
    store.regrade('correct')
    expect(useKanaStore.getState().activeSession?.deck[0]).toMatchObject({ grade: 'correct', recognitionMs: 1000 })
    expect(useKanaStore.getState().activeSession).toMatchObject({ timerRemainingMs: 4000, timerStartedAt: null, reviewQueue: [] })
  })

  it('grades only the active card wrong once when its time expires at navigation', () => {
    const store = useKanaStore.getState()
    store.setPreferences({ timerMs: 1000, shuffled: false, reviewMistakesAtEnd: false })
    store.startSession(undefined, ['hiragana-a', 'hiragana-i'])
    vi.advanceTimersByTime(1000)
    store.navigate(1)
    expect(useKanaStore.getState().activeSession?.deck[0]).toMatchObject({ grade: 'wrong', recognitionMs: 1000 })
    expect(useKanaStore.getState().activeSession?.currentIndex).toBe(1)
    store.navigate(-1)
    store.grade('wrong', 0)
    expect(useKanaStore.getState().kanaProgress['hiragana-a'].totalWrong).toBe(1)
    expect(useKanaStore.getState().activeSession?.deck[1].graded).toBe(false)
  })
})

describe('lesson and review skips', () => {
  it('revisits unanswered cards within Lesson before Review mistakes', () => {
    const store = useKanaStore.getState()
    store.setPreferences({ timerMs: null, shuffled: false, reviewMistakesAtEnd: true })
    store.startSession(undefined, ['hiragana-a', 'hiragana-i', 'hiragana-u'])
    store.navigate(1)
    store.grade('correct', 100)
    store.navigate(1)
    expect(useKanaStore.getState().activeSession).toMatchObject({ phase: 'lesson', lessonSkipped: [0, 2], currentIndex: 0 })
    store.grade('wrong', 200)
    expect(useKanaStore.getState().activeSession).toMatchObject({ phase: 'lesson', currentIndex: 2, lessonSkipped: [2] })
    store.grade('correct', 300)
    expect(useKanaStore.getState().activeSession).toMatchObject({ phase: 'mistakes', reviewQueue: ['hiragana-a'], reviewIndex: 0 })
    store.grade('correct', 50)
    expect(useKanaStore.getState().activeSession?.completed).toBe(true)
  })

  it('finishes after the skipped cards in the same deck when review is off', () => {
    const store = useKanaStore.getState()
    store.setPreferences({ timerMs: null, reviewMistakesAtEnd: false })
    store.startSession(undefined, ['hiragana-a', 'hiragana-i'])
    store.navigate(1)
    store.navigate(1)
    expect(useKanaStore.getState().activeSession).toMatchObject({ phase: 'lesson', lessonSkipped: [0, 1], currentIndex: 0 })
    store.grade('correct', 100)
    expect(useKanaStore.getState().activeSession).toMatchObject({ phase: 'lesson', lessonSkipped: [1], currentIndex: 1 })
    store.navigate(1)
    expect(useKanaStore.getState().activeSession).toMatchObject({ phase: 'lesson', lessonSkipped: [1], currentIndex: 1 })
    store.grade('correct', 200)
    expect(useKanaStore.getState().activeSession?.completed).toBe(true)
  })

  it('keeps Previous history when skipped cards are revisited', () => {
    const store = useKanaStore.getState()
    store.setPreferences({ timerMs: null, shuffled: false, reviewMistakesAtEnd: false })
    store.startSession(undefined, ['hiragana-a', 'hiragana-i', 'hiragana-u'])
    store.navigate(1)
    expect(useKanaStore.getState().activeSession?.lessonSkipped).toEqual([0])
    store.navigate(-1)
    expect(useKanaStore.getState().activeSession?.currentIndex).toBe(0)
    store.navigate(1)
    store.grade('correct', 100)
    store.navigate(1)
    expect(useKanaStore.getState().activeSession?.currentIndex).toBe(0)
    store.navigate(-1)
    expect(useKanaStore.getState().activeSession?.currentIndex).toBe(2)
    store.navigate(1)
    expect(useKanaStore.getState().activeSession?.currentIndex).toBe(0)
  })

  it('applies skip and last-unanswered no-op to Review mistakes', () => {
    const store = useKanaStore.getState()
    store.setPreferences({ timerMs: null, shuffled: false, reviewMistakesAtEnd: true })
    store.startSession(undefined, ['hiragana-a', 'hiragana-i'])
    store.grade('wrong', 100)
    store.grade('wrong', 100)
    expect(useKanaStore.getState().activeSession?.phase).toBe('mistakes')
    store.navigate(1)
    expect(useKanaStore.getState().activeSession).toMatchObject({ reviewIndex: 1, reviewSkipped: [0] })
    store.navigate(-1)
    expect(useKanaStore.getState().activeSession?.reviewIndex).toBe(0)
    store.navigate(1)
    store.grade('correct', 100)
    expect(useKanaStore.getState().activeSession).toMatchObject({ reviewIndex: 0, reviewSkipped: [0] })
    store.navigate(1)
    expect(useKanaStore.getState().activeSession).toMatchObject({ reviewIndex: 0, reviewSkipped: [0] })
    store.grade('correct', 100)
    expect(useKanaStore.getState().activeSession?.completed).toBe(true)
  })

  it('navigates mistake review without resetting either card timer or grading twice', () => {
    const store = useKanaStore.getState()
    store.setPreferences({ timerMs: 5000, shuffled: false, reviewMistakesAtEnd: true })
    store.startSession(undefined, ['hiragana-a', 'hiragana-i'])
    vi.advanceTimersByTime(1000)
    store.grade('wrong', 0)
    vi.advanceTimersByTime(800)
    store.grade('wrong', 0)
    expect(useKanaStore.getState().activeSession?.phase).toBe('mistakes')
    vi.advanceTimersByTime(1000)
    store.navigate(1)
    vi.advanceTimersByTime(500)
    store.navigate(-1)
    expect(useKanaStore.getState().activeSession).toMatchObject({ reviewIndex: 0, timerRemainingMs: 4000 })
    vi.advanceTimersByTime(400)
    store.grade('correct', 0)
    expect(useKanaStore.getState().activeSession?.reviewTimings['hiragana-a']).toBe(1400)
    expect(useKanaStore.getState().activeSession?.reviewIndex).toBe(1)
    store.navigate(-1)
    expect(useKanaStore.getState().activeSession).toMatchObject({ reviewIndex: 0, timerRemainingMs: 3600, timerStartedAt: null })
    store.grade('correct', 0)
    expect(useKanaStore.getState().activeSession?.reviewCompleted).toEqual(['hiragana-a'])
    store.navigate(1)
    store.grade('correct', 0)
    expect(useKanaStore.getState().activeSession?.completed).toBe(true)
    expect(archiveSession(useKanaStore.getState().activeSession!).results[0].recognitionTimes).toEqual([2400])
  })

  it('times out an unanswered review card only once', () => {
    const store = useKanaStore.getState()
    store.setPreferences({ timerMs: 1000, reviewMistakesAtEnd: true })
    store.startSession(undefined, ['hiragana-a'])
    vi.advanceTimersByTime(1000)
    store.grade('wrong', 0)
    expect(useKanaStore.getState().activeSession?.phase).toBe('mistakes')
    vi.advanceTimersByTime(1000)
    store.navigate(1)
    expect(useKanaStore.getState().activeSession).toMatchObject({ completed: true, reviewCompleted: ['hiragana-a'] })
    expect(useKanaStore.getState().activeSession?.reviewTimings['hiragana-a']).toBe(1000)
  })
})

it('migrates a v10 unfinished timer session without losing its cards, history, or stars', async () => {
  const store = useKanaStore.getState()
  store.setPreferences({ timerMs: 5000, shuffled: false })
  store.startSession(undefined, ['hiragana-a', 'hiragana-i'])
  store.toggleStar('hiragana-a')
  const active = useKanaStore.getState().activeSession!
  const history = archiveSession({ ...active, completed: true })
  const legacyActive = {
    ...active,
    phase: undefined,
    skippedOrder: undefined,
    reviewCompleted: undefined,
    reviewElapsedMs: undefined,
    timerPaused: undefined,
    timerRemainingMs: 3200,
    timerStartedAt: 9999,
    deck: active.deck.map(entry => ({ kanaId: entry.kanaId, graded: entry.graded, grade: entry.grade, recognitionMs: entry.recognitionMs })),
  }
  localStorage.setItem('kanaflip:v1', JSON.stringify({
    version: 10,
    state: { preferences: useKanaStore.getState().preferences, kanaProgress: useKanaStore.getState().kanaProgress, sessions: [history], activeSession: legacyActive },
  }))

  await useKanaStore.persist.rehydrate()
  const migrated = useKanaStore.getState()
  expect(migrated.activeSession).toMatchObject({ phase: 'lesson', timerRemainingMs: 3200, timerStartedAt: null, timerPaused: true })
  expect(migrated.activeSession?.deck[0].elapsedMs).toBe(1800)
  expect(migrated.activeSession?.deck).toHaveLength(2)
  expect(migrated.sessions).toHaveLength(1)
  expect(migrated.kanaProgress['hiragana-a'].starred).toBe(true)
})

it('migrates a v11 skipped phase into the lesson without losing pending cards or time', async () => {
  const store = useKanaStore.getState()
  store.setPreferences({ timerMs: 5000, shuffled: false, reviewMistakesAtEnd: false })
  store.startSession(undefined, ['hiragana-a', 'hiragana-i'])
  store.navigate(1)
  const active = useKanaStore.getState().activeSession!
  const legacy = {
    ...active,
    phase: 'skipped',
    skippedOrder: [0, 1],
    currentIndex: 0,
    timerRemainingMs: 3200,
    lessonHistory: undefined,
    lessonCursor: undefined,
    lessonFrontier: undefined,
    lessonSkipped: undefined,
    reviewHistory: undefined,
    reviewCursor: undefined,
    reviewFrontier: undefined,
    reviewSkipped: undefined,
    deck: active.deck.map((entry, index) => ({ ...entry, elapsedMs: index === 0 ? 1800 : 0 })),
  }
  localStorage.setItem('kanaflip:v1', JSON.stringify({ version: 11, state: {
    preferences: useKanaStore.getState().preferences,
    kanaProgress: useKanaStore.getState().kanaProgress,
    sessions: [],
    activeSession: legacy,
  } }))
  await useKanaStore.persist.rehydrate()
  const migrated = useKanaStore.getState().activeSession!
  expect(migrated).toMatchObject({ phase: 'lesson', lessonSkipped: [0, 1], lessonFrontier: 1, timerRemainingMs: 3200, timerPaused: true })
  expect(migrated.deck[0].elapsedMs).toBe(1800)
  store.grade('correct', 0)
  expect(useKanaStore.getState().activeSession).toMatchObject({ phase: 'lesson', currentIndex: 1, lessonSkipped: [1] })
})
