import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { SettingsDialog } from '../components/SettingsDialog'
import { useKanaStore } from '../stores/kanaStore'
import { HomePage } from './HomePage'

afterEach(() => {
  cleanup()
  useKanaStore.getState().clearAll()
})

describe('discard confirmation setting', () => {
  it('is off by default and discards an unfinished study immediately', () => {
    expect(useKanaStore.getState().preferences.confirmDiscard).toBe(false)
    useKanaStore.getState().startSession(undefined, ['hiragana-a'])
    render(<MemoryRouter><HomePage /></MemoryRouter>)

    fireEvent.click(screen.getByRole('button', { name: 'Discard' }))
    expect(useKanaStore.getState().activeSession).toBeNull()
    expect(screen.queryByText('Discard this session?')).toBeNull()
  })

  it('can be enabled in Settings and then asks before discarding', () => {
    render(<SettingsDialog onClose={() => {}} />)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Confirm before discarding study' }))
    expect(useKanaStore.getState().preferences.confirmDiscard).toBe(true)
    expect(JSON.parse(localStorage.getItem('kanaflip:v1') ?? '{}').state.preferences.confirmDiscard).toBe(true)
    cleanup()

    useKanaStore.getState().startSession(undefined, ['hiragana-a'])
    render(<MemoryRouter><HomePage /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }))
    expect(screen.getByText('Discard this session?')).toBeTruthy()
    expect(useKanaStore.getState().activeSession).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Keep it' }))
    expect(useKanaStore.getState().activeSession).not.toBeNull()
  })
})
