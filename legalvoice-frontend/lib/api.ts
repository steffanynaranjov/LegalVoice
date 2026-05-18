// legalvoice-frontend/lib/api.ts
import axios from 'axios'
import { createClient } from './supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL
if (!API_URL) throw new Error('NEXT_PUBLIC_API_URL no está configurado')

const api = axios.create({
  baseURL: API_URL,
})

api.interceptors.request.use(async (config) => {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

export default api
