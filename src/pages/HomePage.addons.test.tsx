import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { useKanaStore } from '../stores/kanaStore'
import { HomePage } from './HomePage'

afterEach(() => {
  cleanup()
  useKanaStore.getState().clearAll()
})

describe('Add-ons study selection', () => {
  it('selects the card without changing either checkbox and blocks an empty deck', () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>)
    fireEvent.click(screen.getByRole('radio', { name: 'Add-ons' }))
    expect(useKanaStore.getState().preferences).toMatchObject({
      characterSet: 'addons',
      reviewMode: 'none',
      includeVoiced: false,
      includeYoon: false,
    })
    expect(screen.getByRole('radio', { name: 'Add-ons' }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByRole('button', { name: /Both92 characters/ }).getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByText('Select at least Voiced marks or Yōon to start learning.')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Start Learning' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('keeps checkbox clicks separate from card selection when the last box is unchecked', () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>)
    fireEvent.click(screen.getByText('Voiced marks'))
    expect(useKanaStore.getState().preferences).toMatchObject({
      characterSet: 'hiragana',
      includeVoiced: true,
      includeYoon: false,
    })
    fireEvent.click(screen.getByRole('radio', { name: 'Add-ons' }))
    expect(useKanaStore.getState().preferences).toMatchObject({ characterSet: 'addons', includeVoiced: true, includeYoon: false })
    fireEvent.click(screen.getByRole('checkbox', { name: /Voiced marks/ }))
    expect(useKanaStore.getState().preferences).toMatchObject({ characterSet: 'addons', includeVoiced: false, includeYoon: false })
  })

  it('persists the new selection on the existing localStorage key', async () => {
    useKanaStore.getState().setPreferences({ characterSet: 'addons', includeVoiced: true, includeYoon: false })
    const raw = localStorage.getItem('kanaflip:v1')
    const saved = JSON.parse(raw ?? '{}')
    expect(saved.state.preferences).toMatchObject({ characterSet: 'addons', includeVoiced: true, includeYoon: false })
    useKanaStore.getState().setPreferences({ characterSet: 'hiragana', includeVoiced: false })
    localStorage.setItem('kanaflip:v1', raw ?? '')
    await useKanaStore.persist.rehydrate()
    expect(useKanaStore.getState().preferences).toMatchObject({ characterSet: 'addons', includeVoiced: true, includeYoon: false })
  })

  it('leaves Review mode when the Add-ons card is chosen', () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: /Starred only/ }))
    expect(useKanaStore.getState().preferences.reviewMode).toBe('starred')
    fireEvent.click(screen.getByRole('radio', { name: 'Add-ons' }))
    expect(useKanaStore.getState().preferences).toMatchObject({ reviewMode: 'none', characterSet: 'addons' })
  })
})
