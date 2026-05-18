'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { TipTapEditor } from '@/components/editor/TipTapEditor'
import { useAutoSave } from '@/hooks/useAutoSave'
import api from '@/lib/api'
import type { Document } from '@/lib/types'
import { Input } from '@/components/ui/input'

export default function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [document, setDocument] = useState<Document | null>(null)
  const [title, setTitle] = useState('Sin título')
  const [content, setContent] = useState<Record<string, unknown>>({})
  const [wordCount, setWordCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'guardado' | 'guardando...' | ''>('guardado')

  useEffect(() => {
    api
      .get<Document>(`/api/v1/documents/${id}`)
      .then(({ data }) => {
        setDocument(data)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Cargando...
      </div>
    )
  }

  if (!document) return null

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b px-6 py-3 flex items-center gap-4">
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

      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto h-full">
          <TipTapEditor content={content} onChange={handleEditorChange} />
        </div>
      </main>
    </div>
  )
}
