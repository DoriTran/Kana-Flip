import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { useKanaStore } from '../stores/kanaStore'
import { HomePage } from './HomePage'
import { LearningPage } from './LearningPage'
import { LessonReviewPage } from './LessonReviewPage'

function Location() {
  const location = useLocation()
  return <output data-testid={'location'}>{location.pathname}</output>
}

function TestRoutes({ initialPath = '/' }: { initialPath?: string }) {
  return <MemoryRouter initialEntries={[initialPath]}>
    <Location />
    <Routes>
      <Route path={'/'} element={<HomePage />} />
      <Route path={'/learn'} element={<LearningPage />} />
      <Route path={'/review/:sessionId'} element={<LessonReviewPage />} />
    </Routes>
  </MemoryRouter>
}

afterEach(() => {
  cleanup()
  useKanaStore.getState().clearAll()
})

it('starts or resumes a Home study with Space, but not from a focused control', () => {
  useKanaStore.getState().setPreferences({ shuffled: false })
  render(<TestRoutes />)
  fireEvent.keyDown(screen.getByRole('button', { name: 'Start Learning' }), { code: 'Space' })
  expect(screen.getByTestId('location').textContent).toBe('/')
  fireEvent.keyDown(window, { code: 'Space' })
  expect(screen.getByTestId('location').textContent).toBe('/learn')
  expect(useKanaStore.getState().activeSession).not.toBeNull()
})

it('resumes an unfinished session with Space without replacing it', () => {
  const store = useKanaStore.getState()
  store.startSession(undefined, ['hiragana-a'])
  const sessionId = useKanaStore.getState().activeSession?.id
  render(<TestRoutes />)
  fireEvent.keyDown(window, { code: 'Space' })
  expect(screen.getByTestId('location').textContent).toBe('/learn')
  expect(useKanaStore.getState().activeSession?.id).toBe(sessionId)
})

it('does not start an invalid Add-ons-only selection with Space', () => {
  useKanaStore.getState().setPreferences({ characterSet: 'addons', includeVoiced: false, includeYoon: false })
  render(<TestRoutes />)
  fireEvent.keyDown(window, { code: 'Space' })
  expect(screen.getByTestId('location').textContent).toBe('/')
  expect(useKanaStore.getState().activeSession).toBeNull()
})

it('uses Space on the result screen to archive and return Home', () => {
  const store = useKanaStore.getState()
  store.startSession(undefined, ['hiragana-a'])
  store.grade('correct', 100)
  render(<TestRoutes initialPath={'/learn'} />)
  fireEvent.keyDown(window, { code: 'Space' })
  expect(screen.getByTestId('location').textContent).toBe('/')
  expect(useKanaStore.getState().activeSession).toBeNull()
  expect(useKanaStore.getState().sessions).toHaveLength(1)
})

it('uses Enter for lesson review, then Space to return Home', () => {
  const store = useKanaStore.getState()
  store.startSession(undefined, ['hiragana-a'])
  store.grade('correct', 100)
  render(<TestRoutes initialPath={'/learn'} />)
  fireEvent.keyDown(window, { code: 'Enter' })
  expect(screen.getByTestId('location').textContent).toMatch(/^\/review\//)
  fireEvent.keyDown(window, { code: 'Space' })
  expect(screen.getByTestId('location').textContent).toBe('/')
})
