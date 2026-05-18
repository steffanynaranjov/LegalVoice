'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useDocuments } from '@/hooks/useDocuments'
import { useFolders } from '@/hooks/useFolders'
import { Sidebar } from '@/components/layout/Sidebar'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import api from '@/lib/api'

export default function DashboardPage() {
  const router = useRouter()
  const { documents, loading, refetch } = useDocuments()
  const { folders } = useFolders()
  const { toasts, toast, dismiss } = useToast()
  const [search, setSearch] = useState('')

  const filtered = documents.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase())
  )

  async function handleNew() {
    try {
      const { data } = await api.post('/api/v1/documents/', { title: 'Sin título' })
      router.push(`/editor/${data.id}`)
    } catch {
      toast('No se pudo crear el documento.', 'error')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este documento?')) return
    try {
      await api.delete(`/api/v1/documents/${id}`)
      refetch()
    } catch {
      alert('Error al eliminar el documento.')
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <Sidebar documents={documents} onNew={handleNew} onDelete={async (id) => {
        try { await api.delete(`/api/v1/documents/${id}`); refetch() } catch { toast('No se pudo eliminar el documento.', 'error') }
      }} />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f5f6f6' }}>
        {/* TopBar */}
        <div style={{ height: 56, background: 'white', borderBottom: '1px solid rgba(23,23,23,0.09)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0 }}>
          <h1 style={{ fontSize: 15, fontWeight: 600, color: '#171717', letterSpacing: '-0.3px', flex: 1 }}>Todos los documentos</h1>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: '#f5f6f6', border: '1px solid rgba(23,23,23,0.09)', borderRadius: 9, width: 240 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(23,23,23,0.38)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar documentos..."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, fontFamily: 'inherit', color: '#171717' }}
            />
          </div>
          <button
            onClick={handleNew}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: '#1D3D58', border: 'none', borderRadius: 9, color: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            + Nuevo
          </button>
        </div>

        {/* Document grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 28px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'rgba(23,23,23,0.35)', fontSize: 14 }}>Cargando...</div>
          ) : filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #1D3D58, #3ea8ca)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: 'white', letterSpacing: '-1px' }}>LV</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#171717' }}>Sin documentos aún</div>
              <div style={{ fontSize: 13.5, color: 'rgba(23,23,23,0.45)', textAlign: 'center', maxWidth: 320, lineHeight: 1.6 }}>Crea tu primer documento jurídico con dictado por voz</div>
              <button onClick={handleNew} style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', background: '#1D3D58', border: 'none', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                + Nuevo documento
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {filtered.map(doc => {
                const folder = folders.find(f => f.id === doc.folder_id)
                return (
                  <div
                    key={doc.id}
                    className="fade-in"
                    style={{ background: 'white', border: '1px solid rgba(23,23,23,0.09)', borderRadius: 10, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.13s', position: 'relative' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(23,23,23,0.08)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(62,168,202,0.28)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(23,23,23,0.09)' }}
                  >
                    <Link href={`/editor/${doc.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: '#171717', lineHeight: 1.4, flex: 1 }}>{doc.title}</div>
                        {folder && (
                          <span style={{ fontSize: 10, padding: '2px 7px', background: 'rgba(23,23,23,0.06)', borderRadius: 5, color: 'rgba(23,23,23,0.42)', flexShrink: 0, marginTop: 2 }}>{folder.name}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11.5, color: 'rgba(23,23,23,0.38)' }}>{new Date(doc.updated_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        <span style={{ fontSize: 11.5, color: 'rgba(23,23,23,0.38)' }}>{doc.word_count} palabras</span>
                      </div>
                    </Link>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(doc.id) }}
                      style={{ position: 'absolute', top: 10, right: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(23,23,23,0.25)', fontSize: 16, lineHeight: 1, padding: '2px 5px', borderRadius: 4, opacity: 0, transition: 'opacity 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                    >×</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
