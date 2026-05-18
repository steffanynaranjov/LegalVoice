'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { Document } from '@/lib/types'

interface SidebarProps {
  documents: Document[]
  activeDocId?: string
  onNew: () => void
  onDelete?: (id: string) => void
}

export function Sidebar({ documents, activeDocId, onNew, onDelete }: SidebarProps) {
  const router = useRouter()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function requestDelete(e: React.MouseEvent, id: string) {
    e.preventDefault()
    e.stopPropagation()
    setPendingDeleteId(id)
  }

  function confirmDelete() {
    if (pendingDeleteId && onDelete) onDelete(pendingDeleteId)
    setPendingDeleteId(null)
  }

  const pendingDoc = documents.find(d => d.id === pendingDeleteId)

  return (
    <>
      <ConfirmDialog
        open={!!pendingDeleteId}
        title="Eliminar documento"
        message={pendingDoc ? `"${pendingDoc.title}" se eliminará de forma permanente.` : 'Este documento se eliminará de forma permanente.'}
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />

      <div style={{
        width: 240,
        minWidth: 240,
        height: '100%',
        background: 'linear-gradient(to bottom, #0a1729 0%, #0a1729 60%, #1D3D58 100%)',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 13px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <img src="/logo.png" alt="LegalVoice" width={28} height={28} style={{ borderRadius: 7, flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'white', letterSpacing: '-0.3px' }}>LegalVoice</span>
        </div>

        {/* New button */}
        <div style={{ padding: '12px 10px 8px' }}>
          <button
            onClick={onNew}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'rgba(62,168,202,0.18)', border: '1px solid rgba(62,168,202,0.28)', borderRadius: 10, color: '#3ea8ca', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.13s' }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Nuevo documento
          </button>
        </div>

        {/* Doc list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 6px' }}>
          {documents.length === 0 && (
            <div style={{ padding: '12px 14px', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Sin documentos aún</div>
          )}
          {documents.map(doc => {
            const isActive = doc.id === activeDocId
            const isHovered = hoveredId === doc.id
            return (
              <Link key={doc.id} href={`/editor/${doc.id}`} style={{ textDecoration: 'none' }}>
                <div
                  onMouseEnter={() => setHoveredId(doc.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    padding: '7px 8px 7px 14px',
                    cursor: 'pointer',
                    borderRadius: 8,
                    margin: '1px 2px',
                    transition: 'all 0.11s',
                    borderLeft: isActive ? '2px solid #3ea8ca' : '2px solid transparent',
                    background: isActive ? 'rgba(62,168,202,0.18)' : isHovered ? 'rgba(255,255,255,0.05)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: isActive ? 500 : 400, color: isActive ? 'white' : 'rgba(255,255,255,0.65)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{new Date(doc.updated_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}</div>
                  </div>
                  {onDelete && isHovered && (
                    <button
                      onClick={e => requestDelete(e, doc.id)}
                      title="Eliminar"
                      style={{
                        flexShrink: 0,
                        width: 22,
                        height: 22,
                        borderRadius: 5,
                        background: 'rgba(239,68,68,0.15)',
                        border: '1px solid rgba(239,68,68,0.25)',
                        color: 'rgba(239,68,68,0.8)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        lineHeight: 1,
                        transition: 'all 0.12s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(239,68,68,0.3)'
                        e.currentTarget.style.color = '#ef4444'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(239,68,68,0.15)'
                        e.currentTarget.style.color = 'rgba(239,68,68,0.8)'
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {/* User / logout */}
        <div
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}
        >
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #1D3D58, #3ea8ca)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', flex: 1 }}>Cerrar sesión</span>
        </div>
      </div>
    </>
  )
}
