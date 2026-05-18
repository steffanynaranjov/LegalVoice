'use client'
import { useState, useRef, useCallback } from 'react'
import api from '@/lib/api'

interface VoicePanelProps {
  onInsert: (text: string) => void
}

type RecordingState = 'idle' | 'recording' | 'transcribing'

function Waveform({ active }: { active: boolean }) {
  const bars = 28
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2.5, height: 36 }}>
      {Array.from({ length: bars }, (_, i) => {
        const h = active ? 6 + Math.abs(Math.sin(i * 0.72 + 0.3)) * 24 : 4
        return (
          <div
            key={i}
            className={active ? 'wave-bar' : ''}
            style={{
              width: 3,
              height: h,
              background: active ? '#3ea8ca' : 'rgba(62,168,202,0.3)',
              borderRadius: 2,
              animationDelay: `${(i * 0.048) % 0.96}s`,
              transition: 'height 0.15s ease',
            }}
          />
        )
      })}
    </div>
  )
}

export function VoicePanel({ onInsert }: VoicePanelProps) {
  const [state, setState] = useState<RecordingState>('idle')
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')
  const [seconds, setSeconds] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startRecording = useCallback(async () => {
    setError('')

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000,
        },
      })
    } catch {
      setError('No se pudo acceder al micrófono. Verifica los permisos.')
      return
    }

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : ''

    chunksRef.current = []
    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 64000 })
      : new MediaRecorder(stream)
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop())
      if (timerRef.current) clearInterval(timerRef.current)

      const mimeType = recorder.mimeType || 'audio/webm'
      const blob = new Blob(chunksRef.current, { type: mimeType })

      if (blob.size < 1000) {
        setError('Grabación demasiado corta o sin audio. Inténtalo de nuevo.')
        setState('idle')
        setSeconds(0)
        return
      }

      setState('transcribing')

      const ext = mimeType.includes('ogg') ? 'audio.ogg' : mimeType.includes('mp4') ? 'audio.mp4' : 'audio.webm'
      const form = new FormData()
      form.append('file', blob, ext)

      try {
        const { data } = await api.post<{ text: string }>('/api/v1/transcribe/', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        setTranscript(prev => prev ? prev + ' ' + data.text : data.text)
      } catch {
        setError('Error al transcribir. Inténtalo de nuevo.')
      } finally {
        setState('idle')
        setSeconds(0)
      }
    }

    recorder.start(250)
    setState('recording')
    setSeconds(0)
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
  }, [])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
  }, [])

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && transcript.trim()) {
      e.preventDefault()
      onInsert(transcript)
      setTranscript('')
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f5f6f6', position: 'relative', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', background: 'white', borderBottom: '1px solid rgba(23,23,23,0.09)', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1D3D58' }}>Voz y texto</div>
        <div style={{ fontSize: 12, color: 'rgba(23,23,23,0.4)', marginTop: 2 }}>Dicta o escribe — luego inserta al documento</div>
      </div>

      {/* Central status area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: 16 }}>
        {state === 'recording' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#3ea8ca', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Escuchando</div>
            <Waveform active={true} />
            <div style={{ fontSize: 12, color: 'rgba(23,23,23,0.4)' }}>{fmt(seconds)} — toca para detener</div>
          </div>
        )}
        {state === 'transcribing' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <svg className="spin-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3ea8ca" strokeWidth="2" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            <div style={{ fontSize: 13, color: 'rgba(23,23,23,0.5)' }}>Transcribiendo...</div>
          </div>
        )}
        {state === 'idle' && !transcript && (
          <div className="fade-in" style={{ textAlign: 'center' }}>
            <Waveform active={false} />
            <div style={{ fontSize: 13, color: 'rgba(23,23,23,0.4)', marginTop: 12 }}>Dicta o escribe abajo</div>
          </div>
        )}
        {error && (
          <div style={{ padding: '8px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 12.5, color: '#dc2626', textAlign: 'center' }}>{error}</div>
        )}
      </div>

      {/* Unified input — always visible */}
      <div style={{ padding: '12px 14px 16px', background: 'white', borderTop: '1px solid rgba(23,23,23,0.09)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: '10px 12px', background: '#f5f6f6', border: '1px solid rgba(23,23,23,0.09)', borderRadius: 12 }}>
          <textarea
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe o presiona el micrófono para dictar…"
            rows={3}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontSize: 13.5, color: '#171717', fontFamily: 'inherit', lineHeight: 1.55 }}
          />
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0, paddingBottom: 1 }}>
            {/* Mic button */}
            <button
              onClick={state === 'recording' ? stopRecording : startRecording}
              disabled={state === 'transcribing'}
              className={state === 'recording' ? 'mic-recording' : ''}
              title={state === 'recording' ? 'Detener' : 'Dictar'}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: state === 'recording' ? '#3ea8ca' : 'rgba(62,168,202,0.08)',
                border: `1px solid ${state === 'recording' ? '#3ea8ca' : 'rgba(62,168,202,0.28)'}`,
                cursor: state === 'transcribing' ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s', flexShrink: 0,
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={state === 'recording' ? 'white' : '#3ea8ca'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </button>
            {/* Insert button */}
            <button
              onClick={() => { if (transcript.trim()) { onInsert(transcript); setTranscript('') } }}
              disabled={!transcript.trim()}
              title="Insertar en documento (⌘+Enter)"
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: transcript.trim() ? '#1D3D58' : 'rgba(62,168,202,0.08)',
                border: 'none',
                cursor: transcript.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s', flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={transcript.trim() ? 'white' : '#3ea8ca'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(23,23,23,0.3)', marginTop: 6, paddingLeft: 2 }}>⌘+Enter para insertar</div>
      </div>
    </div>
  )
}
