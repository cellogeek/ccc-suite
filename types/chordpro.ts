export interface ChordProSong {
  id?: string;
  title: string;
  artist?: string;
  key?: string;
  tempo?: number;
  capo?: number;
  content: string; // ChordPro formatted content
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  isPublic: boolean;
}

export interface ChordProLine {
  type: 'chord' | 'lyric' | 'directive' | 'comment' | 'empty';
  content: string;
  chords?: ChordPosition[];
}

export interface ChordPosition {
  chord: string;
  position: number;
}

export interface ParsedSong {
  title: string;
  artist?: string;
  key?: string;
  tempo?: number;
  capo?: number;
  sections: SongSection[];
  metadata: Record<string, string>;
}

export interface SongSection {
  type: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'tag' | 'instrumental';
  label?: string;
  lines: ChordProLine[];
}

export interface TranspositionOptions {
  fromKey: string;
  toKey: string;
  useFlats?: boolean;
}

export interface Setlist {
  id?: string;
  title: string;
  description?: string;
  date?: Date;
  songs: SetlistSong[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SetlistSong {
  songId: string;
  order: number;
  key?: string; // Override key for this performance
  notes?: string;
  song?: ChordProSong; // Populated when fetched
}

export interface ChordProExportOptions {
  format: 'html' | 'pdf' | 'txt';
  showChords: boolean;
  fontSize: number;
  includeMetadata: boolean;
  chordsAboveLyrics: boolean;
}