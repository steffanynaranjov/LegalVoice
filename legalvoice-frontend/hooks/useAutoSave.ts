import { useEffect, useRef } from 'react'
import api from '@/lib/api'

export function useAutoSave(
  documentId: string | null,
  content: Record<string, unknown>,
  wordCount: number,
  title: string
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!documentId) return

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      api.put(`/api/v1/documents/${documentId}`, {
        content,
        word_count: wordCount,
        title,
      })
    }, 2000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [documentId, content, wordCount, title])
}
