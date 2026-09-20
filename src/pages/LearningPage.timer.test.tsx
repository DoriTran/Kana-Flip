import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { useKanaStore } from '../stores/kanaStore'
import { LearningPage } from './LearningPage'

afterEach(() => {
  cleanup()
  useKanaStore.getState().clearAll()
})

it('shows timer navigation buttons and keyboard shortcuts unless Lock navigation is enabled', () => {
  const store = useKanaStore.getState()
  store.setPreferences({ timerMs: 5000, shuffled: false })
  store.startSession(undefined, ['hiragana-a', 'hiragana-i'])
  render(<MemoryRouter><LearningPage /></MemoryRouter>)

  fireEvent.click(screen.getByRole('button', { name: /Next/ }))
  expect(useKanaStore.getState().activeSession?.currentIndex).toBe(1)
  fireEvent.keyDown(window, { code: 'ArrowLeft' })
  expect(useKanaStore.getState().activeSession?.currentIndex).toBe(0)

  act(() => store.setPreferences({ lockNavigation: true }))
  expect(screen.queryByRole('button', { name: /Next/ })).toBeNull()
  fireEvent.keyDown(window, { code: 'ArrowRight' })
  expect(useKanaStore.getState().activeSession?.currentIndex).toBe(0)
})

it('shows a yellow skip count only while unanswered skipped cards remain', () => {
  const store = useKanaStore.getState()
  store.setPreferences({ timerMs: null, shuffled: false, reviewMistakesAtEnd: false })
  store.startSession(undefined, ['hiragana-a', 'hiragana-i'])
  render(<MemoryRouter><LearningPage /></MemoryRouter>)
  expect(screen.queryByLabelText('1 skipped cards')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: /Next/ }))
  expect(screen.getByLabelText('1 skipped cards').textContent).toContain('1')
  act(() => store.grade('correct', 100))
  expect(screen.getByLabelText('1 skipped cards').textContent).toContain('1')
  act(() => store.grade('correct', 100))
  expect(screen.queryByLabelText('1 skipped cards')).toBeNull()
})
