import type { Folder } from '@/lib/types'

interface FolderTreeProps {
  folders: Folder[]
  selectedFolderId: string | null
  onSelect: (id: string | null) => void
  onDelete: (id: string) => void
}

export function FolderTree({ folders, selectedFolderId, onSelect, onDelete }: FolderTreeProps) {
  return (
    <nav className="space-y-1">
      <button
        onClick={() => onSelect(null)}
        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
          selectedFolderId === null
            ? 'bg-gray-100 font-medium'
            : 'hover:bg-gray-50 text-gray-700'
        }`}
      >
        Todos los documentos
      </button>

      {folders.length > 0 && (
        <div className="mt-3">
          <p className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
            Carpetas
          </p>
          {folders.map((folder) => (
            <div key={folder.id} className="flex items-center group">
              <button
                onClick={() => onSelect(folder.id)}
                className={`flex-1 flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                  selectedFolderId === folder.id
                    ? 'bg-gray-100 font-medium'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: folder.color }}
                />
                <span className="truncate">{folder.name}</span>
              </button>
              <button
                onClick={() => onDelete(folder.id)}
                className="opacity-0 group-hover:opacity-100 px-2 text-red-400 hover:text-red-600 text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </nav>
  )
}
