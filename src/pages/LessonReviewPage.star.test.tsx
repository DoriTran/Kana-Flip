import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useKanaStore } from '../stores/kanaStore'
import { LessonReviewPage } from './LessonReviewPage'

afterEach(() => {
  cleanup()
  useKanaStore.getState().clearAll()
})

it('shares the Alphabet star state on each lesson review card', () => {
  const store = useKanaStore.getState()
  store.startSession(undefined, ['hiragana-a'])
  store.grade('correct', 100)
  const session = store.archiveActive()!
  render(<MemoryRouter initialEntries={[`/review/${session.id}`]}>
    <Routes><Route path={'/review/:sessionId'} element={<LessonReviewPage />} /></Routes>
  </MemoryRouter>)

  fireEvent.click(screen.getByRole('button', { name: 'Star kana' }))
  expect(useKanaStore.getState().kanaProgress['hiragana-a'].starred).toBe(true)
  expect(screen.getByRole('button', { name: 'Unstar kana' }).getAttribute('aria-pressed')).toBe('true')

  fireEvent.click(screen.getByRole('button', { name: 'Unstar kana' }))
  expect(useKanaStore.getState().kanaProgress['hiragana-a'].starred).toBe(false)
})
