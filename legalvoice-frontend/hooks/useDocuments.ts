import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import type { Document } from '@/lib/types'

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await api.get<Document[]>('/api/v1/documents/')
      setDocuments(data)
    } catch {
      setError('Error al cargar documentos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  return { documents, loading, error, refetch: fetchDocuments }
}
