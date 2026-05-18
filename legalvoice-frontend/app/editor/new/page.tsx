'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function NewDocumentPage() {
  const router = useRouter()
  const didCreate = useRef(false)

  useEffect(() => {
    if (didCreate.current) return
    didCreate.current = true
    api
      .post('/api/v1/documents/', { title: 'Sin título' })
      .then(({ data }) => router.replace(`/editor/${data.id}`))
      .catch(() => router.replace('/dashboard'))
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      Creando documento...
    </div>
  )
}
