import { renderHook, waitFor } from '@testing-library/react'
import { useDocuments } from '@/hooks/useDocuments'

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({
      data: [
        {
          id: 'doc-1',
          user_id: 'user-1',
          folder_id: null,
          title: 'Contrato',
          content: {},
          word_count: 150,
          updated_at: '2026-05-17T00:00:00+00:00',
        },
      ],
    }),
  },
}))

describe('useDocuments', () => {
  it('carga documentos y termina en loading=false', async () => {
    const { result } = renderHook(() => useDocuments())
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.documents).toHaveLength(1)
    expect(result.current.documents[0].title).toBe('Contrato')
  })
})
