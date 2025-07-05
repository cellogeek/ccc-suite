import { supabase } from '../lib/supabase';
import { Slide, ComplianceReport } from '../types/scripture';
import { ChordProSong, Setlist, SetlistSong } from '../types/chordpro';

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

  // ===== ORGANIZATION-WIDE ESV API KEY METHODS =====

  // Get organization ESV API key (from app_settings table)
  async getOrganizationEsvApiKey(): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('esv_api_key')
        .eq('id', 'global')
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data.esv_api_key || null;
    } catch (error) {
      console.error('Error getting organization ESV API key:', error);
      return null;
    }
  }

  // Save organization ESV API key (to app_settings table)
  async saveOrganizationEsvApiKey(apiKey: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert([{
          id: 'global',
          esv_api_key: apiKey,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        }], { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving organization ESV API key:', error);
      throw error;
    }
  }

  // ===== CHORDPRO SONG METHODS =====

  // Save ChordPro song
  async saveSong(song: Omit<ChordProSong, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const songData = {
        title: song.title,
        artist: song.artist,
        key: song.key,
        tempo: song.tempo,
        capo: song.capo,
        content: song.content,
        tags: song.tags,
        user_id: song.userId,
        is_public: song.isPublic,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('songs')
        .insert([songData])
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error saving song:', error);
      throw error;
    }
  }

  // Get user's ChordPro songs
  async getUserSongs(userId: string): Promise<ChordProSong[]> {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return data.map(song => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        key: song.key,
        tempo: song.tempo,
        capo: song.capo,
        content: song.content,
        tags: song.tags || [],
        createdAt: new Date(song.created_at),
        updatedAt: new Date(song.updated_at),
        userId: song.user_id,
        isPublic: song.is_public
      }));
    } catch (error) {
      console.error('Error getting user songs:', error);
      throw error;
    }
  }

  // Search ChordPro songs
  async searchSongs(query: string, userId: string): Promise<ChordProSong[]> {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,artist.ilike.%${query}%,content.ilike.%${query}%`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return data.map(song => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        key: song.key,
        tempo: song.tempo,
        capo: song.capo,
        content: song.content,
        tags: song.tags || [],
        createdAt: new Date(song.created_at),
        updatedAt: new Date(song.updated_at),
        userId: song.user_id,
        isPublic: song.is_public
      }));
    } catch (error) {
      console.error('Error searching songs:', error);
      throw error;
    }
  }

  // Update ChordPro song
  async updateSong(songId: string, updates: Partial<ChordProSong>): Promise<void> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.artist !== undefined) updateData.artist = updates.artist;
      if (updates.key !== undefined) updateData.key = updates.key;
      if (updates.tempo !== undefined) updateData.tempo = updates.tempo;
      if (updates.capo !== undefined) updateData.capo = updates.capo;
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;

      const { error } = await supabase
        .from('songs')
        .update(updateData)
        .eq('id', songId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating song:', error);
      throw error;
    }
  }

  // Delete ChordPro song
  async deleteSong(songId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', songId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting song:', error);
      throw error;
    }
  }

  // ===== SETLIST METHODS =====

  // Save setlist
  async saveSetlist(setlist: Omit<Setlist, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const setlistData = {
        title: setlist.title,
        description: setlist.description,
        service_date: setlist.date?.toISOString().split('T')[0],
        user_id: setlist.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('setlists')
        .insert([setlistData])
        .select()
        .single();

      if (error) throw error;

      // Save setlist songs
      if (setlist.songs.length > 0) {
        const setlistSongsData = setlist.songs.map(song => ({
          setlist_id: data.id,
          song_id: song.songId,
          order_index: song.order,
          override_key: song.key,
          notes: song.notes
        }));

        const { error: songsError } = await supabase
          .from('setlist_songs')
          .insert(setlistSongsData);

        if (songsError) throw songsError;
      }

      return data.id;
    } catch (error) {
      console.error('Error saving setlist:', error);
      throw error;
    }
  }

  // Get user's setlists
  async getUserSetlists(userId: string): Promise<Setlist[]> {
    try {
      const { data, error } = await supabase
        .from('setlists')
        .select(`
          *,
          setlist_songs (
            *,
            songs (*)
          )
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return data.map(setlist => ({
        id: setlist.id,
        title: setlist.title,
        description: setlist.description,
        date: setlist.service_date ? new Date(setlist.service_date) : undefined,
        songs: setlist.setlist_songs
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((ss: any) => ({
            songId: ss.song_id,
            order: ss.order_index,
            key: ss.override_key,
            notes: ss.notes,
            song: ss.songs ? {
              id: ss.songs.id,
              title: ss.songs.title,
              artist: ss.songs.artist,
              key: ss.songs.key,
              tempo: ss.songs.tempo,
              capo: ss.songs.capo,
              content: ss.songs.content,
              tags: ss.songs.tags || [],
              createdAt: new Date(ss.songs.created_at),
              updatedAt: new Date(ss.songs.updated_at),
              userId: ss.songs.user_id,
              isPublic: ss.songs.is_public
            } : undefined
          })),
        userId: setlist.user_id,
        createdAt: new Date(setlist.created_at),
        updatedAt: new Date(setlist.updated_at)
      }));
    } catch (error) {
      console.error('Error getting user setlists:', error);
      throw error;
    }
  }

  // ===== USER SETTINGS METHODS (for personal preferences only) =====

  // Get user settings (personal preferences, no ESV key)
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

  // Save user settings (personal preferences only)
  async saveUserSettings(userId: string, settings: UserSettings): Promise<void> {
    try {
      const settingsData = {
        user_id: userId,
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

  // Legacy method for backward compatibility - now gets organization key
  async getEsvApiKey(userId?: string): Promise<string | null> {
    return this.getOrganizationEsvApiKey();
  }
}

export const supabaseService = SupabaseService.getInstance();