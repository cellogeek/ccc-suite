import { supabase } from '../lib/supabase';
import { Slide, ComplianceReport } from '../types/scripture';

export interface PresentationData {
  id?: string;
  userId: string;
  title: string;
  scriptureReference: string;
  slides: Slide[];
  complianceReport: ComplianceReport;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  tags: string[];
}

export interface UserSettings {
  esvApiKey?: string;
  defaultFontSize?: number;
  defaultMaxVerses?: number;
  defaultExportFormat?: 'rtf' | 'txt' | 'pro';
  autoSave?: boolean;
}

export class SupabaseService {
  private static instance: SupabaseService;

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  // Save presentation to Supabase
  async savePresentation(presentation: Omit<PresentationData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const presentationData = {
        user_id: presentation.userId,
        title: presentation.title,
        scripture_reference: presentation.scriptureReference,
        slides: presentation.slides,
        compliance_report: presentation.complianceReport,
        is_public: presentation.isPublic,
        tags: presentation.tags,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('presentations')
        .insert([presentationData])
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error saving presentation:', error);
      throw error;
    }
  }

  // Update existing presentation
  async updatePresentation(id: string, updates: Partial<PresentationData>): Promise<void> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.title) updateData.title = updates.title;
      if (updates.scriptureReference) updateData.scripture_reference = updates.scriptureReference;
      if (updates.slides) updateData.slides = updates.slides;
      if (updates.complianceReport) updateData.compliance_report = updates.complianceReport;
      if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;
      if (updates.tags) updateData.tags = updates.tags;

      const { error } = await supabase
        .from('presentations')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating presentation:', error);
      throw error;
    }
  }

  // Get user's presentations
  async getUserPresentations(userId: string, limitCount: number = 50): Promise<PresentationData[]> {
    try {
      const { data, error } = await supabase
        .from('presentations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(limitCount);

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        title: item.title,
        scriptureReference: item.scripture_reference,
        slides: item.slides,
        complianceReport: item.compliance_report,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        isPublic: item.is_public,
        tags: item.tags || [],
      }));
    } catch (error) {
      console.error('Error getting user presentations:', error);
      throw error;
    }
  }

  // Get single presentation
  async getPresentation(id: string): Promise<PresentationData | null> {
    try {
      const { data, error } = await supabase
        .from('presentations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        scriptureReference: data.scripture_reference,
        slides: data.slides,
        complianceReport: data.compliance_report,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        isPublic: data.is_public,
        tags: data.tags || [],
      };
    } catch (error) {
      console.error('Error getting presentation:', error);
      throw error;
    }
  }

  // Delete presentation
  async deletePresentation(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('presentations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting presentation:', error);
      throw error;
    }
  }

  // Get public presentations (for sharing)
  async getPublicPresentations(limitCount: number = 20): Promise<PresentationData[]> {
    try {
      const { data, error } = await supabase
        .from('presentations')
        .select('*')
        .eq('is_public', true)
        .order('updated_at', { ascending: false })
        .limit(limitCount);

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        title: item.title,
        scriptureReference: item.scripture_reference,
        slides: item.slides,
        complianceReport: item.compliance_report,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        isPublic: item.is_public,
        tags: item.tags || [],
      }));
    } catch (error) {
      console.error('Error getting public presentations:', error);
      throw error;
    }
  }

  // Search presentations by scripture reference
  async searchPresentations(userId: string, searchTerm: string): Promise<PresentationData[]> {
    try {
      const { data, error } = await supabase
        .from('presentations')
        .select('*')
        .eq('user_id', userId)
        .or(`scripture_reference.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        title: item.title,
        scriptureReference: item.scripture_reference,
        slides: item.slides,
        complianceReport: item.compliance_report,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        isPublic: item.is_public,
        tags: item.tags || [],
      }));
    } catch (error) {
      console.error('Error searching presentations:', error);
      throw error;
    }
  }

  // ===== USER SETTINGS METHODS =====

  // Get user settings
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return {
        esvApiKey: data.esv_api_key,
        defaultFontSize: data.default_font_size,
        defaultMaxVerses: data.default_max_verses,
        defaultExportFormat: data.default_export_format,
        autoSave: data.auto_save,
      };
    } catch (error) {
      console.error('Error getting user settings:', error);
      throw error;
    }
  }

  // Save user settings
  async saveUserSettings(userId: string, settings: UserSettings): Promise<void> {
    try {
      const settingsData = {
        user_id: userId,
        esv_api_key: settings.esvApiKey || null,
        default_font_size: settings.defaultFontSize || 46,
        default_max_verses: settings.defaultMaxVerses || 4,
        default_export_format: settings.defaultExportFormat || 'rtf',
        auto_save: settings.autoSave !== false,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_settings')
        .upsert([settingsData], { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving user settings:', error);
      throw error;
    }
  }

  // Get ESV API key for a user (for scripture service)
  async getEsvApiKey(userId: string): Promise<string | null> {
    try {
      const settings = await this.getUserSettings(userId);
      return settings?.esvApiKey || null;
    } catch (error) {
      console.error('Error getting ESV API key:', error);
      return null;
    }
  }
}

export const supabaseService = SupabaseService.getInstance();
