import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Presentation {
  id: string
  user_id: string
  title: string
  scripture_reference: string
  slides: any[]
  compliance_report: any
  streaming_title?: string
  streaming_description?: string
  is_public: boolean
  tags: string[]
  created_at: string
  updated_at: string
}

export interface AppSettings {
  id: string
  esv_api_key: string
  updated_at: string
  updated_by: string
}