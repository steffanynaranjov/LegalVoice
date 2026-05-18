'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Underline } from '@tiptap/extension-underline'
import { TextAlign } from '@tiptap/extension-text-align'
import { CharacterCount } from '@tiptap/extension-character-count'
import { Toolbar } from './Toolbar'
import { WordCount } from './WordCount'

interface TipTapEditorProps {
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>, wordCount: number) => void
}

export function TipTapEditor({ content, onChange }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      CharacterCount,
    ],
    content,
    onUpdate({ editor }) {
      const json = editor.getJSON() as Record<string, unknown>
      const words = editor.storage.characterCount.words() as number
      onChange(json, words)
    },
    editorProps: {
      attributes: {
        class: 'outline-none min-h-full',
      },
    },
  })

  if (!editor) return null

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-white">
      <Toolbar editor={editor} />
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-3xl mx-auto prose prose-sm sm:prose">
          <EditorContent editor={editor} className="min-h-[500px]" />
        </div>
      </div>
      <WordCount editor={editor} />
    </div>
  )
}
