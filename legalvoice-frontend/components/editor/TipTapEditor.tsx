'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import { useImperativeHandle, forwardRef } from 'react'
import StarterKit from '@tiptap/starter-kit'
import { Underline } from '@tiptap/extension-underline'
import { TextAlign } from '@tiptap/extension-text-align'
import { CharacterCount } from '@tiptap/extension-character-count'
import { Toolbar } from './Toolbar'
import { WordCount } from './WordCount'

export interface TipTapEditorRef {
  insertText: (text: string) => void
}

interface TipTapEditorProps {
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>, wordCount: number) => void
}

export const TipTapEditor = forwardRef<TipTapEditorRef, TipTapEditorProps>(
  function TipTapEditor({ content, onChange }, ref) {
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

  useImperativeHandle(ref, () => ({
    insertText: (text: string) => {
      if (!editor) return
      editor.chain().focus().insertContent(text).run()
    },
  }))

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
})
