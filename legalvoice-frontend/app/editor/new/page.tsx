'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function NewDocumentPage() {
  const router = useRouter()
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (creating) return
    setCreating(true)
    api
      .post('/api/v1/documents/', { title: 'Sin título' })
      .then(({ data }) => router.replace(`/editor/${data.id}`))
  }, [router, creating])

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      Creando documento...
    </div>
  )
}
