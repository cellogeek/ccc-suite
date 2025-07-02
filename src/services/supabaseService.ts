import { supabase } from '../lib/supabase'
import { Slide, ComplianceReport } from '../types/scripture'

export interface PresentationData {
  id?: string
  user_id: string
  title: string
  scripture_reference: string
  slides: Slide[]
  compliance_report: ComplianceReport
  streaming_title?: string
  streaming_description?: string
  is_public: boolean
  tags: string[]
  created_at?: string
  updated_at?: string
}

export class SupabaseService {
  private static instance: SupabaseService
  
  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService()
    }
    return SupabaseService.instance
  }

  // Save presentation
  async savePresentation(presentation: Omit<PresentationData, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('presentations')
        .insert([presentation])
        .select()
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('Error saving presentation:', error)
      throw error
    }
  }

  // Update presentation
  async updatePresentation(id: string, updates: Partial<PresentationData>): Promise<void> {
    try {
      const { error } = await supabase
        .from('presentations')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error updating presentation:', error)
      throw error
    }
  }

  // Get user's presentations
  async getUserPresentations(userId: string, limit: number = 50): Promise<PresentationData[]> {
    try {
      const { data, error } = await supabase
        .from('presentations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting user presentations:', error)
      throw error
    }
  }

  // Get single presentation
  async getPresentation(id: string): Promise<PresentationData | null> {
    try {
      const { data, error } = await supabase
        .from('presentations')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting presentation:', error)
      return null
    }
  }

  // Delete presentation
  async deletePresentation(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('presentations')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting presentation:', error)
      throw error
    }
  }

  // Get public presentations
  async getPublicPresentations(limit: number = 20): Promise<PresentationData[]> {
    try {
      const { data, error } = await supabase
        .from('presentations')
        .select('*')
        .eq('is_public', true)
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting public presentations:', error)
      throw error
    }
  }

  // Search presentations
  async searchPresentations(userId: string, searchTerm: string): Promise<PresentationData[]> {
    try {
      const { data, error } = await supabase
        .from('presentations')
        .select('*')
        .eq('user_id', userId)
        .or(`scripture_reference.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%`)
        .order('updated_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error searching presentations:', error)
      throw error
    }
  }

  // ESV API Key management
  async getESVApiKey(): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('esv_api_key')
        .eq('id', 'global')
        .single()

      if (error) return null
      return data?.esv_api_key || null
    } catch (error) {
      console.error('Error getting ESV API key:', error)
      return null
    }
  }

  async updateESVApiKey(apiKey: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          id: 'global',
          esv_api_key: apiKey,
          updated_by: userId,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
    } catch (error) {
      console.error('Error updating ESV API key:', error)
      throw error
    }
  }

  // Get current user
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }

  // Sign in with Google
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
    return data
  }

  // Sign in with email
  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  }

  // Sign up with email
  async signUpWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    if (error) throw error
    return data
  }

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }
}

export const supabaseService = SupabaseService.getInstance()