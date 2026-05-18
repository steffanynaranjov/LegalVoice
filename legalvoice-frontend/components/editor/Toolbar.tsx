'use client'
import type { Editor } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface ToolbarProps {
  editor: Editor
}

interface ToolbarButton {
  label: string
  action: () => void
  isActive: boolean
  title: string
}

export function Toolbar({ editor }: ToolbarProps) {
  const buttons: ToolbarButton[] = [
    {
      label: 'N',
      title: 'Negrita',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
    },
    {
      label: 'I',
      title: 'Cursiva',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
    },
    {
      label: 'S',
      title: 'Subrayado',
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: editor.isActive('underline'),
    },
  ]

  const headingButtons = [1, 2, 3].map((level) => ({
    label: `H${level}`,
    title: `Encabezado ${level}`,
    action: () => editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run(),
    isActive: editor.isActive('heading', { level }),
  }))

  const alignButtons = [
    { label: '←', title: 'Izquierda', align: 'left' },
    { label: '=', title: 'Centro', align: 'center' },
    { label: '→', title: 'Derecha', align: 'right' },
    { label: '≡', title: 'Justificado', align: 'justify' },
  ].map(({ label, title, align }) => ({
    label,
    title,
    action: () => editor.chain().focus().setTextAlign(align).run(),
    isActive: editor.isActive({ textAlign: align }),
  }))

  const renderButton = ({ label, title, action, isActive }: ToolbarButton, i: number) => (
    <Button
      key={i}
      variant={isActive ? 'default' : 'ghost'}
      size="sm"
      onClick={action}
      title={title}
      className="h-8 w-8 p-0 font-mono text-xs"
    >
      {label}
    </Button>
  )

  return (
    <div className="flex items-center gap-1 p-2 border-b bg-white flex-wrap">
      {buttons.map(renderButton)}
      <Separator orientation="vertical" className="h-6 mx-1" />
      {headingButtons.map(renderButton)}
      <Separator orientation="vertical" className="h-6 mx-1" />
      {alignButtons.map(renderButton)}
      <Separator orientation="vertical" className="h-6 mx-1" />
      <Button
        variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Lista"
        className="h-8 w-8 p-0 text-xs"
      >
        •≡
      </Button>
      <Button
        variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Lista numerada"
        className="h-8 w-8 p-0 text-xs"
      >
        1≡
      </Button>
    </div>
  )
}
