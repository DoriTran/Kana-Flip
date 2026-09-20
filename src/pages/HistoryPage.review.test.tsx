import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { useKanaStore } from '../stores/kanaStore'
import type { StudySession } from '../types/kana'
import { recentWrongCount, slowReviewIds } from '../utils/stats'
import { HistoryPage } from './HistoryPage'

afterEach(() => {
  cleanup()
  useKanaStore.getState().clearAll()
})

it('shows full metrics for old and new review records without feeding study statistics', () => {
  const store = useKanaStore.getState()
  store.setPreferences({ shuffled: false, timerMs: null, reviewMistakesAtEnd: false })
  store.startSession('recent-mistakes', ['hiragana-a', 'hiragana-i'])
  store.grade('wrong', 2000)
  store.grade('correct', 4000)
  const newReview = store.archiveActive()!
  expect(newReview.type).toBe('review')
  expect(useKanaStore.getState().kanaProgress['hiragana-a']).toBeUndefined()

  const oldReview: StudySession = {
    id: 'old-review', type: 'review', source: 'starred',
    startedAt: 1, finishedAt: 2, shuffled: false, timerMs: null, reviewMistakesAtEnd: false,
    results: [
      { kanaId: 'hiragana-a', correctCount: 1, wrongCount: 0, recognitionTimes: [2000] },
      { kanaId: 'hiragana-i', correctCount: 0, wrongCount: 1, recognitionTimes: [4000] },
    ],
  }
  const study: StudySession = {
    id: 'study', type: 'study', source: 'hiragana',
    startedAt: 1, finishedAt: 3, shuffled: false, timerMs: null, reviewMistakesAtEnd: false,
    results: [{ kanaId: 'hiragana-a', correctCount: 0, wrongCount: 1, recognitionTimes: [6000] }],
  }
  useKanaStore.setState({ sessions: [newReview, oldReview, study] })
  const sessions = useKanaStore.getState().sessions
  expect(recentWrongCount(sessions, 'hiragana-a')).toBe(1)
  expect(slowReviewIds(sessions, 'top-30', 5000)).toEqual(['hiragana-a'])

  render(<MemoryRouter><HistoryPage /></MemoryRouter>)
  expect(screen.getByText('1 study sessions')).toBeTruthy()
  for (const title of ['Recent Mistakes · 2 cards', 'Starred · 2 cards']) {
    const row = screen.getByText(title).closest('article')!
    expect(row.classList.contains('review-row')).toBe(false)
    expect(within(row).getByText('1 / 2')).toBeTruthy()
    expect(within(row).getByText('50%')).toBeTruthy()
    expect(within(row).getByText('1 mistakes')).toBeTruthy()
    expect(within(row).getByText('3.0s avg')).toBeTruthy()
  }
  expect(screen.getByText('0 / 1')).toBeTruthy()
})
