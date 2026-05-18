'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TipTapEditor, type TipTapEditorRef } from '@/components/editor/TipTapEditor'
import { VoicePanel } from '@/components/editor/VoicePanel'
import { Sidebar } from '@/components/layout/Sidebar'
import { ToastContainer } from '@/components/ui/Toast'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useDocuments } from '@/hooks/useDocuments'
import { useToast } from '@/hooks/useToast'
import api from '@/lib/api'
import type { Document } from '@/lib/types'

export default function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const editorRef = useRef<TipTapEditorRef>(null)
  const { documents } = useDocuments()
  const { toasts, toast, dismiss } = useToast()

  const [docData, setDocData] = useState<Document | null>(null)
  const [title, setTitle] = useState('Sin título')
  const [content, setContent] = useState<Record<string, unknown>>({})
  const [wordCount, setWordCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'guardado' | 'guardando...' | ''>('guardado')
  const [translating, setTranslating] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    api
      .get<Document>(`/api/v1/documents/${id}`)
      .then(({ data }) => {
        setDocData(data)
        setTitle(data.title)
        setContent(data.content)
        setWordCount(data.word_count)
      })
      .catch(() => router.push('/dashboard'))
      .finally(() => setLoading(false))
  }, [id, router])

  const handleEditorChange = useCallback(
    (newContent: Record<string, unknown>, newWordCount: number) => {
      setContent(newContent)
      setWordCount(newWordCount)
      setSaveStatus('guardando...')
    },
    []
  )

  useEffect(() => {
    if (saveStatus !== 'guardando...') return
    const timer = setTimeout(() => setSaveStatus('guardado'), 2500)
    return () => clearTimeout(timer)
  }, [saveStatus, content])

  useAutoSave(id, content, wordCount, title)

  const handleInsertTranscript = useCallback((text: string) => {
    editorRef.current?.insertText(text)
  }, [])

  async function handleNew() {
    try {
      const { data } = await api.post('/api/v1/documents/', { title: 'Sin título' })
      router.push(`/editor/${data.id}`)
    } catch {
      toast('No se pudo crear el documento.', 'error')
    }
  }

  async function handleTranslate() {
    if (translating) return
    setTranslating(true)
    try {
      const { data: translated } = await api.post<{ title: string; content: Record<string, unknown> }>(
        '/api/v1/translate/',
        { title, content }
      )
      const { data: newDoc } = await api.post('/api/v1/documents/', {
        title: translated.title,
        content: translated.content,
      })
      router.push(`/editor/${newDoc.id}`)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast(detail || 'Error al traducir el documento.', 'error')
    } finally {
      setTranslating(false)
    }
  }

  async function handleExportDocx() {
    if (exporting) return
    setExporting(true)
    try {
      const response = await api.post('/api/v1/export/docx', { title, content }, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `${title}.docx`
      a.click()
      URL.revokeObjectURL(url)
      toast('Documento descargado.', 'success')
    } catch {
      toast('Error al exportar el documento.', 'error')
    } finally {
      setExporting(false)
    }
  }

  async function handleDelete(docId: string) {
    try {
      await api.delete(`/api/v1/documents/${docId}`)
      if (docId === id) router.push('/dashboard')
    } catch {
      toast('No se pudo eliminar el documento.', 'error')
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: 'rgba(23,23,23,0.4)', fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
        Cargando...
      </div>
    )
  }

  if (!docData) return null

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      {/* Panel 1: Sidebar */}
      <Sidebar documents={documents} activeDocId={id} onNew={handleNew} onDelete={handleDelete} />

      {/* Panel 2: Voice */}
      <div style={{ width: 320, minWidth: 280, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(23,23,23,0.09)', overflow: 'hidden' }}>
        <VoicePanel onInsert={handleInsertTranscript} />
      </div>

      {/* Panel 3: Document editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#e8e8e8', overflow: 'hidden' }}>
        {/* Doc TopBar */}
        <div style={{ height: 48, background: 'white', borderBottom: '1px solid rgba(23,23,23,0.09)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D3D58" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13.5, fontWeight: 500, color: '#171717', background: 'transparent', fontFamily: 'inherit', letterSpacing: '-0.2px' }}
            placeholder="Sin título"
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'rgba(23,23,23,0.45)', padding: '4px 9px', borderRadius: 6, background: 'rgba(23,23,23,0.04)', flexShrink: 0 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: saveStatus === 'guardado' ? '#22c55e' : '#f59e0b', animation: saveStatus === 'guardando...' ? 'pulse 1s ease infinite' : 'none' }}></div>
            {saveStatus}
          </div>
          <div style={{ fontSize: 11.5, color: 'rgba(23,23,23,0.35)' }}>{wordCount} palabras</div>
          {/* Export Word */}
          <button
            onClick={handleExportDocx}
            disabled={exporting || wordCount === 0}
            title="Descargar como Word"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px',
              background: 'rgba(29,61,88,0.07)',
              border: '1px solid rgba(29,61,88,0.18)',
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 500,
              color: exporting ? 'rgba(29,61,88,0.4)' : '#1D3D58',
              cursor: exporting || wordCount === 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              flexShrink: 0,
              transition: 'all 0.15s',
              opacity: wordCount === 0 ? 0.4 : 1,
            }}
          >
            {exporting ? (
              <>
                <svg className="spin-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1D3D58" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Exportando…
              </>
            ) : (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1D3D58" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Word
              </>
            )}
          </button>

          {/* Translate */}
          <button
            onClick={handleTranslate}
            disabled={translating || wordCount === 0}
            title="Traducir al inglés"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px',
              background: translating ? 'rgba(62,168,202,0.08)' : 'rgba(62,168,202,0.10)',
              border: '1px solid rgba(62,168,202,0.28)',
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 500,
              color: translating ? 'rgba(62,168,202,0.5)' : '#3ea8ca',
              cursor: translating || wordCount === 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              flexShrink: 0,
              transition: 'all 0.15s',
              opacity: wordCount === 0 ? 0.4 : 1,
            }}
          >
            {translating ? (
              <>
                <svg className="spin-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3ea8ca" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Traduciendo…
              </>
            ) : (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3ea8ca" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                Traducir al inglés
              </>
            )}
          </button>
        </div>

        {/* Live Preview label */}
        <div style={{ height: 36, background: 'white', borderBottom: '1px solid rgba(23,23,23,0.09)', display: 'flex', alignItems: 'center', padding: '0 14px', flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(23,23,23,0.4)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Vista previa en vivo</span>
        </div>

        {/* Scrollable paper area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 680, background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.07)', borderRadius: 4, padding: '40px 48px', minHeight: 600 }}>
            <TipTapEditor ref={editorRef} content={content} onChange={handleEditorChange} />
          </div>
        </div>
      </div>
    </div>
  )
}
