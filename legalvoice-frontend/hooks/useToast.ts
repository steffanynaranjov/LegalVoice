import { useState, useCallback } from 'react'
import type { ToastData, ToastType } from '@/components/ui/Toast'

let _id = 0

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++_id
    setToasts(prev => [...prev, { id, message, type }])
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, toast, dismiss }
}
