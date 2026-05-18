'use client'
import { useEffect } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Eliminar', onConfirm, onCancel }: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter') onConfirm()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onConfirm, onCancel])

  if (!open) return null

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(10,23,41,0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: 14,
          boxShadow: '0 24px 64px rgba(10,23,41,0.22), 0 4px 16px rgba(10,23,41,0.12)',
          padding: '28px 28px 22px',
          width: 360,
          maxWidth: 'calc(100vw - 32px)',
          animation: 'fadeIn 0.18s ease forwards',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </div>

        <div style={{ fontSize: 15, fontWeight: 600, color: '#171717', marginBottom: 6, letterSpacing: '-0.3px' }}>{title}</div>
        <div style={{ fontSize: 13.5, color: 'rgba(23,23,23,0.55)', lineHeight: 1.6, marginBottom: 24 }}>{message}</div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 18px',
              background: 'transparent',
              border: '1px solid rgba(23,23,23,0.12)',
              borderRadius: 9,
              fontSize: 13.5,
              fontWeight: 500,
              color: 'rgba(23,23,23,0.6)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(23,23,23,0.28)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(23,23,23,0.12)'}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 18px',
              background: '#ef4444',
              border: 'none',
              borderRadius: 9,
              fontSize: 13.5,
              fontWeight: 500,
              color: 'white',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.12s',
              boxShadow: '0 2px 8px rgba(239,68,68,0.28)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
            onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
