import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Document, Folder } from '@/lib/types'

interface DocumentCardProps {
  document: Document
  folder?: Folder
  onDelete: (id: string) => void
}

export function DocumentCard({ document, folder, onDelete }: DocumentCardProps) {
  const updatedAt = new Date(document.updated_at).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-base line-clamp-2">
          <Link href={`/editor/${document.id}`} className="hover:underline">
            {document.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            {folder && (
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: folder.color }}
              />
            )}
            <span>{folder?.name ?? 'Sin carpeta'}</span>
          </div>
          <span>{document.word_count} palabras</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">{updatedAt}</span>
          <button
            onClick={() => onDelete(document.id)}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Eliminar
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
