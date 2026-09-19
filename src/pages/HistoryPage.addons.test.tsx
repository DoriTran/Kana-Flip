import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { useKanaStore } from '../stores/kanaStore'
import type { StudySession } from '../types/kana'
import { HistoryPage } from './HistoryPage'

afterEach(() => {
  cleanup()
  useKanaStore.getState().clearAll()
})

it('shows Add-ons groups as the main History title with matching kana', () => {
  const sessions: StudySession[] = [
    { id: 'both', includeVoiced: true, includeYoon: true, results: [{ kanaId: 'hiragana-ja', correctCount: 1, wrongCount: 0, recognitionTimes: [1000] }] },
    { id: 'voiced', includeVoiced: true, includeYoon: false, results: [{ kanaId: 'hiragana-ga', correctCount: 1, wrongCount: 0, recognitionTimes: [1000] }] },
    { id: 'yoon', includeVoiced: false, includeYoon: true, results: [{ kanaId: 'hiragana-kya', correctCount: 1, wrongCount: 0, recognitionTimes: [1000] }] },
  ].map(session => ({ ...session, type: 'study', source: 'addons', startedAt: 1, finishedAt: 2, shuffled: false, timerMs: null, reviewMistakesAtEnd: false }))
  useKanaStore.setState({ sessions })
  render(<MemoryRouter><HistoryPage /></MemoryRouter>)
  expect(screen.getByText('Voiced + Yōon')).toBeTruthy()
  expect(screen.getByText('Voiced')).toBeTruthy()
  expect(screen.getByText('Yōon')).toBeTruthy()
  expect(screen.getByText('じゃ')).toBeTruthy()
  expect(screen.getByText('が')).toBeTruthy()
  expect(screen.getByText('ゃ')).toBeTruthy()
})

it('shows History dates as day/month/year and time without seconds', () => {
  const finishedAt = new Date(2026, 8, 19, 15, 31, 3).getTime()
  useKanaStore.setState({ sessions: [{
    id: 'dated', type: 'study', source: 'hiragana', startedAt: finishedAt - 1000,
    finishedAt, shuffled: false, timerMs: null, reviewMistakesAtEnd: false,
    results: [{ kanaId: 'hiragana-a', correctCount: 1, wrongCount: 0, recognitionTimes: [1000] }],
  }] })
  render(<MemoryRouter><HistoryPage /></MemoryRouter>)
  expect(screen.getByText('19/09/2026. 03:31 PM')).toBeTruthy()
})
