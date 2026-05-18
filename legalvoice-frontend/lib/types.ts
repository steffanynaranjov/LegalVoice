export interface Document {
  id: string
  user_id: string
  folder_id: string | null
  title: string
  content: Record<string, unknown>
  word_count: number
  updated_at: string
}

export interface Folder {
  id: string
  user_id: string
  name: string
  client_name: string | null
  color: string
}
