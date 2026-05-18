import type { Editor } from '@tiptap/react'

interface WordCountProps {
  editor: Editor
}

export function WordCount({ editor }: WordCountProps) {
  const words = editor.storage.characterCount?.words() ?? 0
  const characters = editor.storage.characterCount?.characters() ?? 0

  return (
    <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-400 flex gap-4">
      <span>{words} palabras</span>
      <span>{characters} caracteres</span>
    </div>
  )
}
