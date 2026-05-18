import { DocumentCard } from './DocumentCard'
import type { Document, Folder } from '@/lib/types'

interface DocumentListProps {
  documents: Document[]
  folders: Folder[]
  onDelete: (id: string) => void
}

export function DocumentList({ documents, folders, onDelete }: DocumentListProps) {
  const folderMap = Object.fromEntries(folders.map((f) => [f.id, f]))

  if (documents.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg mb-2">No tienes documentos aún</p>
        <p className="text-sm">Crea tu primer documento jurídico</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          folder={doc.folder_id ? folderMap[doc.folder_id] : undefined}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
