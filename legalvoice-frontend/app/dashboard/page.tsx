'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDocuments } from '@/hooks/useDocuments'
import { useFolders } from '@/hooks/useFolders'
import { DocumentList } from '@/components/documents/DocumentList'
import { FolderTree } from '@/components/documents/FolderTree'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase'
import api from '@/lib/api'

export default function DashboardPage() {
  const router = useRouter()
  const { documents, loading: docsLoading, refetch: refetchDocs } = useDocuments()
  const { folders, refetch: refetchFolders } = useFolders()
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)

  const filteredDocs = selectedFolderId
    ? documents.filter((d) => d.folder_id === selectedFolderId)
    : documents

  async function handleNewDocument() {
    const { data } = await api.post('/api/v1/documents/', {
      title: 'Sin título',
      folder_id: selectedFolderId ?? undefined,
    })
    router.push(`/editor/${data.id}`)
  }

  async function handleDeleteDocument(id: string) {
    if (!confirm('¿Eliminar este documento?')) return
    await api.delete(`/api/v1/documents/${id}`)
    refetchDocs()
  }

  async function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault()
    if (!newFolderName.trim()) return
    await api.post('/api/v1/folders/', { name: newFolderName.trim() })
    setNewFolderName('')
    setShowNewFolder(false)
    refetchFolders()
  }

  async function handleDeleteFolder(id: string) {
    if (!confirm('¿Eliminar esta carpeta?')) return
    await api.delete(`/api/v1/folders/${id}`)
    if (selectedFolderId === id) setSelectedFolderId(null)
    refetchFolders()
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">LegalVoice</h1>
        <div className="flex items-center gap-3">
          <Button onClick={handleNewDocument}>+ Nuevo documento</Button>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700">
            Salir
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-65px)]">
        <aside className="w-56 bg-white border-r p-4 flex flex-col gap-4 overflow-y-auto">
          <FolderTree
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelect={setSelectedFolderId}
            onDelete={handleDeleteFolder}
          />

          {showNewFolder ? (
            <form onSubmit={handleCreateFolder} className="space-y-2">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Nombre de carpeta"
                autoFocus
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="flex-1">Crear</Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowNewFolder(false)}
                >
                  ×
                </Button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowNewFolder(true)}
              className="text-sm text-gray-400 hover:text-gray-600 text-left"
            >
              + Nueva carpeta
            </button>
          )}
        </aside>

        <main className="flex-1 p-6 overflow-y-auto">
          {docsLoading ? (
            <div className="text-center py-16 text-gray-400">Cargando documentos...</div>
          ) : (
            <DocumentList
              documents={filteredDocs}
              folders={folders}
              onDelete={handleDeleteDocument}
            />
          )}
        </main>
      </div>
    </div>
  )
}
