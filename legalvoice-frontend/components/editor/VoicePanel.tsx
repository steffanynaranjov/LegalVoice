'use client'
import { useState, useRef, useCallback } from 'react'
import api from '@/lib/api'

interface VoicePanelProps {
  onInsert: (text: string) => void
}

type RecordingState = 'idle' | 'recording' | 'transcribing'

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
    setTranscript('')

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setError('No se pudo acceder al micrófono. Verifica los permisos.')
      return
    }

    chunksRef.current = []
    const recorder = new MediaRecorder(stream)
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop())
      if (timerRef.current) clearInterval(timerRef.current)

      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      setState('transcribing')

      const form = new FormData()
      form.append('file', blob, 'audio.webm')

      try {
        const { data } = await api.post<{ text: string }>('/api/v1/transcribe/', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        setTranscript(data.text)
      } catch {
        setError('Error al transcribir. Inténtalo de nuevo.')
      } finally {
        setState('idle')
        setSeconds(0)
      }
    }

    recorder.start()
    setState('recording')
    setSeconds(0)
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
  }, [])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
  }, [])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col h-full bg-white border-l">
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <h2 className="text-sm font-medium text-gray-700">Dictado por voz</h2>
        <p className="text-xs text-gray-400 mt-0.5">Graba y transcribe al documento</p>
      </div>

      {/* Mic button */}
      <div className="flex flex-col items-center justify-center gap-4 py-8 px-4 border-b">
        <button
          onClick={state === 'recording' ? stopRecording : startRecording}
          disabled={state === 'transcribing'}
          className={`
            w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-md
            ${state === 'recording'
              ? 'bg-red-500 hover:bg-red-600 animate-pulse'
              : state === 'transcribing'
              ? 'bg-gray-200 cursor-not-allowed'
              : 'bg-gray-900 hover:bg-gray-700'
            }
          `}
          title={state === 'recording' ? 'Detener grabación' : 'Iniciar grabación'}
        >
          {state === 'transcribing' ? (
            <svg className="w-8 h-8 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1a4 4 0 014 4v6a4 4 0 01-8 0V5a4 4 0 014-4zm0 2a2 2 0 00-2 2v6a2 2 0 004 0V5a2 2 0 00-2-2z" />
              <path d="M8 11a1 1 0 011 1 3 3 0 006 0 1 1 0 112 0 5 5 0 01-4 4.9V19h2a1 1 0 010 2H9a1 1 0 010-2h2v-2.1A5 5 0 017 12a1 1 0 011-1z" />
            </svg>
          )}
        </button>

        <div className="text-center">
          {state === 'recording' && (
            <p className="text-sm font-mono text-red-500">{formatTime(seconds)} — Grabando...</p>
          )}
          {state === 'transcribing' && (
            <p className="text-sm text-gray-400">Transcribiendo...</p>
          )}
          {state === 'idle' && (
            <p className="text-xs text-gray-400">
              {transcript ? 'Listo para insertar' : 'Presiona para grabar'}
            </p>
          )}
        </div>
      </div>

      {/* Transcript area */}
      <div className="flex-1 flex flex-col p-4 gap-3 overflow-hidden">
        {error && (
          <p className="text-xs text-red-500 bg-red-50 rounded p-2">{error}</p>
        )}

        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="La transcripción aparecerá aquí. Puedes editarla antes de insertar."
          className="flex-1 w-full text-sm text-gray-700 resize-none rounded-lg border border-gray-200 p-3 focus:outline-none focus:ring-1 focus:ring-gray-300"
        />

        <div className="flex gap-2">
          <button
            onClick={() => onInsert(transcript)}
            disabled={!transcript.trim()}
            className="flex-1 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
          >
            Insertar en documento
          </button>
          {transcript && (
            <button
              onClick={() => setTranscript('')}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
