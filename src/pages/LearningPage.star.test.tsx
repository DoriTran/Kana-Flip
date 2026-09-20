import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { useKanaStore } from '../stores/kanaStore'
import { AlphabetPage } from './AlphabetPage'
import { LearningPage } from './LearningPage'

afterEach(() => {
  cleanup()
  useKanaStore.getState().clearAll()
  vi.useRealTimers()
})

it('uses E and Enter to star during a lesson without un-starring on repeated presses', () => {
  useKanaStore.getState().startSession(undefined, ['hiragana-a'])
  render(<MemoryRouter><LearningPage /></MemoryRouter>)

  fireEvent.keyDown(window, { code: 'KeyE' })
  expect(useKanaStore.getState().kanaProgress['hiragana-a']?.starred).toBe(true)
  fireEvent.keyDown(window, { code: 'Enter' })
  fireEvent.keyDown(window, { code: 'KeyE' })
  expect(useKanaStore.getState().kanaProgress['hiragana-a']?.starred).toBe(true)

  cleanup()
  render(<MemoryRouter><AlphabetPage /></MemoryRouter>)
  fireEvent.click(screen.getByRole('button', { name: 'Unstar kana' }))
  expect(useKanaStore.getState().kanaProgress['hiragana-a']?.starred).toBe(false)
})

it('replays Star above Flip for one second after every press', () => {
  vi.useFakeTimers()
  useKanaStore.getState().startSession(undefined, ['hiragana-a'])
  render(<MemoryRouter><LearningPage /></MemoryRouter>)

  fireEvent.keyDown(window, { code: 'KeyE' })
  const firstNotice = screen.getByRole('status')
  expect(firstNotice.textContent?.trim()).toBe('Star')
  act(() => vi.advanceTimersByTime(500))
  fireEvent.keyDown(window, { code: 'Enter' })
  expect(screen.getByRole('status')).not.toBe(firstNotice)
  expect(useKanaStore.getState().kanaProgress['hiragana-a']?.starred).toBe(true)
  act(() => vi.advanceTimersByTime(999))
  expect(screen.getByRole('status').textContent?.trim()).toBe('Star')
  act(() => vi.advanceTimersByTime(1))
  expect(screen.queryByRole('status')).toBeNull()
})
