'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError('No se pudo crear la cuenta. Verifica los datos e inténtalo de nuevo.')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
      <div style={{ width: 420, background: 'linear-gradient(to bottom, #0a1729 0%, #1D3D58 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <Image src="/logo.png" alt="LegalVoice" width={52} height={52} unoptimized style={{ borderRadius: 14, marginBottom: 24 }} />
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'white', margin: '0 0 12px', letterSpacing: '-0.5px', textAlign: 'center' }}>LegalVoice</h1>
        <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 1.7, maxWidth: 280, margin: 0 }}>Crea tu cuenta y empieza a redactar documentos jurídicos con tu voz.</p>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f6f6', padding: 48 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: '#171717', margin: '0 0 6px', letterSpacing: '-0.4px' }}>Crear cuenta</h2>
          <p style={{ fontSize: 13.5, color: 'rgba(23,23,23,0.45)', margin: '0 0 32px' }}>Empieza gratis en LegalVoice</p>

          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 13, color: '#dc2626', marginBottom: 20 }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: 'rgba(23,23,23,0.6)', marginBottom: 6 }}>Correo electrónico</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                style={{ width: '100%', padding: '10px 13px', background: 'white', border: '1px solid rgba(23,23,23,0.12)', borderRadius: 9, fontSize: 13.5, fontFamily: 'inherit', color: '#171717', outline: 'none', transition: 'border-color 0.15s' }}
                onFocus={e => (e.target.style.borderColor = '#3ea8ca')}
                onBlur={e => (e.target.style.borderColor = 'rgba(23,23,23,0.12)')}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: 'rgba(23,23,23,0.6)', marginBottom: 6 }}>Contraseña</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                style={{ width: '100%', padding: '10px 13px', background: 'white', border: '1px solid rgba(23,23,23,0.12)', borderRadius: 9, fontSize: 13.5, fontFamily: 'inherit', color: '#171717', outline: 'none', transition: 'border-color 0.15s' }}
                onFocus={e => (e.target.style.borderColor = '#3ea8ca')}
                onBlur={e => (e.target.style.borderColor = 'rgba(23,23,23,0.12)')}
              />
            </div>
            <button
              type="submit" disabled={loading}
              style={{ marginTop: 6, padding: '11px', background: '#1D3D58', border: 'none', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.75 : 1, boxShadow: '0 4px 14px rgba(29,61,88,0.2)' }}
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'rgba(23,23,23,0.45)' }}>
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" style={{ color: '#3ea8ca', fontWeight: 500, textDecoration: 'none' }}>Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
