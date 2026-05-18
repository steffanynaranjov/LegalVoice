import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import type { Folder } from '@/lib/types'

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFolders = useCallback(async () => {
    try {
      const { data } = await api.get<Folder[]>('/api/v1/folders/')
      setFolders(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFolders()
  }, [fetchFolders])

  return { folders, loading, refetch: fetchFolders }
}
