'use client'
import { useEffect } from 'react'

export type ToastType = 'error' | 'success' | 'info'

export interface ToastData {
  id: number
  message: string
  type: ToastType
}

interface ToastProps {
  toasts: ToastData[]
  onDismiss: (id: number) => void
}

const ICONS: Record<ToastType, React.ReactNode> = {
  error: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  success: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
    </svg>
  ),
  info: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3ea8ca" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
}

const COLORS: Record<ToastType, { bg: string; border: string }> = {
  error:   { bg: 'rgba(239,68,68,0.07)',   border: 'rgba(239,68,68,0.2)' },
  success: { bg: 'rgba(34,197,94,0.07)',   border: 'rgba(34,197,94,0.2)' },
  info:    { bg: 'rgba(62,168,202,0.07)',  border: 'rgba(62,168,202,0.22)' },
}

function ToastItem({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(t)
  }, [toast.id, onDismiss])

  const { bg, border } = COLORS[toast.type]

  return (
    <div
      className="fade-in"
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '11px 14px',
        background: 'white',
        border: `1px solid ${border}`,
        borderLeft: `3px solid ${border.replace('0.2', '0.8').replace('0.22', '0.8')}`,
        borderRadius: 10,
        boxShadow: '0 4px 20px rgba(23,23,23,0.10)',
        minWidth: 280,
        maxWidth: 380,
        cursor: 'pointer',
      }}
      onClick={() => onDismiss(toast.id)}
    >
      <div style={{ flexShrink: 0, marginTop: 1 }}>{ICONS[toast.type]}</div>
      <span style={{ fontSize: 13.5, color: '#171717', lineHeight: 1.5, flex: 1 }}>{toast.message}</span>
    </div>
  )
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
      display: 'flex', flexDirection: 'column', gap: 8,
      alignItems: 'flex-end',
    }}>
      {toasts.map(t => <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />)}
    </div>
  )
}
