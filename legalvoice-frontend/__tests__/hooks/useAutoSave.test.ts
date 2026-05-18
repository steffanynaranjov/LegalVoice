import { renderHook, act } from '@testing-library/react'
import { useAutoSave } from '@/hooks/useAutoSave'

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { put: jest.fn().mockResolvedValue({}) },
}))

import api from '@/lib/api'
const mockPut = api.put as jest.Mock

beforeEach(() => {
  jest.useFakeTimers()
  mockPut.mockClear()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('useAutoSave', () => {
  it('no guarda si documentId es null', () => {
    renderHook(() => useAutoSave(null, {}, 0, 'Título'))
    act(() => { jest.advanceTimersByTime(3000) })
    expect(mockPut).not.toHaveBeenCalled()
  })

  it('guarda después de 2 segundos de inactividad', () => {
    renderHook(() => useAutoSave('doc-123', { type: 'doc' }, 10, 'Título'))
    act(() => { jest.advanceTimersByTime(2000) })
    expect(mockPut).toHaveBeenCalledWith('/api/v1/documents/doc-123', {
      content: { type: 'doc' },
      word_count: 10,
      title: 'Título',
    })
  })

  it('resetea el timer si el contenido cambia antes de 2 segundos', () => {
    const { rerender } = renderHook(
      ({ content }: { content: Record<string, unknown> }) =>
        useAutoSave('doc-123', content, 5, 'Título'),
      { initialProps: { content: { v: 1 } } }
    )
    act(() => { jest.advanceTimersByTime(1000) })
    rerender({ content: { v: 2 } })
    act(() => { jest.advanceTimersByTime(1000) })
    expect(mockPut).not.toHaveBeenCalled()
    act(() => { jest.advanceTimersByTime(1000) })
    expect(mockPut).toHaveBeenCalledTimes(1)
  })
})
