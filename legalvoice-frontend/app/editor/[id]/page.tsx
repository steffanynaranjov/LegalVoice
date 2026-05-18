'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { TipTapEditor, type TipTapEditorRef } from '@/components/editor/TipTapEditor'
import { VoicePanel } from '@/components/editor/VoicePanel'
import { useAutoSave } from '@/hooks/useAutoSave'
import api from '@/lib/api'
import type { Document } from '@/lib/types'
import { Input } from '@/components/ui/input'

export default function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const editorRef = useRef<TipTapEditorRef>(null)

  const [docData, setDocData] = useState<Document | null>(null)
  const [title, setTitle] = useState('Sin título')
  const [content, setContent] = useState<Record<string, unknown>>({})
  const [wordCount, setWordCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'guardado' | 'guardando...' | ''>('guardado')

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Cargando...
      </div>
    )
  }

  if (!docData) return null

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-3 flex items-center gap-4 shrink-0">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          ← Dashboard
        </Link>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 max-w-md border-0 text-lg font-medium focus-visible:ring-0 px-0"
          placeholder="Sin título"
        />
        <span className="text-xs text-gray-400 ml-auto">{saveStatus}</span>
      </header>

      {/* Split layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — editor */}
        <main className="flex-1 overflow-auto p-6">
          <div className="h-full max-w-3xl mx-auto">
            <TipTapEditor ref={editorRef} content={content} onChange={handleEditorChange} />
          </div>
        </main>

        {/* Right — voice panel */}
        <aside className="w-80 shrink-0 overflow-auto">
          <VoicePanel onInsert={handleInsertTranscript} />
        </aside>
      </div>
    </div>
  )
}
