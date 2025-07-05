import { supabaseService } from './supabaseService';

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

export class ChordProService {
  private static instance: ChordProService;

  public static getInstance(): ChordProService {
    if (!ChordProService.instance) {
      ChordProService.instance = new ChordProService();
    }
    return ChordProService.instance;
  }

  // Parse ChordPro content into structured format
  parseChordPro(content: string): ParsedSong {
    const lines = content.split('\n');
    const song: ParsedSong = {
      title: '',
      sections: [],
      metadata: {}
    };

    let currentSection: SongSection | null = null;
    let currentSectionType: string = 'verse';
    let verseCount = 1;
    let chorusCount = 1;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine === '') {
        // Empty line - end current section if exists
        if (currentSection && currentSection.lines.length > 0) {
          song.sections.push(currentSection);
          currentSection = null;
        }
        continue;
      }

      // Handle directives (metadata)
      if (trimmedLine.startsWith('{') && trimmedLine.endsWith('}')) {
        const directive = trimmedLine.slice(1, -1);
        this.parseDirective(directive, song);
        continue;
      }

      // Handle comments
      if (trimmedLine.startsWith('#')) {
        if (!currentSection) {
          currentSection = {
            type: currentSectionType as any,
            lines: []
          };
        }
        currentSection.lines.push({
          type: 'comment',
          content: trimmedLine.slice(1).trim()
        });
        continue;
      }

      // Handle chord/lyric lines
      if (!currentSection) {
        currentSection = {
          type: currentSectionType as any,
          label: currentSectionType === 'verse' ? `Verse ${verseCount}` : 
                 currentSectionType === 'chorus' ? `Chorus ${chorusCount}` : 
                 currentSectionType.charAt(0).toUpperCase() + currentSectionType.slice(1),
          lines: []
        };
      }

      const parsedLine = this.parseChordLine(trimmedLine);
      currentSection.lines.push(parsedLine);
    }

    // Add final section if exists
    if (currentSection && currentSection.lines.length > 0) {
      song.sections.push(currentSection);
    }

    return song;
  }

  // Parse individual chord/lyric line
  private parseChordLine(line: string): ChordProLine {
    const chordRegex = /\[([^\]]+)\]/g;
    const chords: ChordPosition[] = [];
    let match;
    let content = line;

    // Extract chords and their positions
    while ((match = chordRegex.exec(line)) !== null) {
      chords.push({
        chord: match[1],
        position: match.index
      });
    }

    // Remove chord brackets from content
    content = line.replace(chordRegex, '');

    return {
      type: chords.length > 0 ? 'chord' : 'lyric',
      content,
      chords: chords.length > 0 ? chords : undefined
    };
  }

  // Parse ChordPro directives
  private parseDirective(directive: string, song: ParsedSong): void {
    const colonIndex = directive.indexOf(':');
    if (colonIndex === -1) {
      // Simple directive
      const lower = directive.toLowerCase();
      if (lower === 'soc' || lower === 'start_of_chorus') {
        // Will be handled in section logic
      }
      return;
    }

    const key = directive.slice(0, colonIndex).trim().toLowerCase();
    const value = directive.slice(colonIndex + 1).trim();

    switch (key) {
      case 't':
      case 'title':
        song.title = value;
        break;
      case 'st':
      case 'subtitle':
      case 'artist':
        song.artist = value;
        break;
      case 'key':
        song.key = value;
        break;
      case 'tempo':
        song.tempo = parseInt(value);
        break;
      case 'capo':
        song.capo = parseInt(value);
        break;
      default:
        song.metadata[key] = value;
    }
  }

  // Transpose chords to different key
  transposeChords(content: string, options: TranspositionOptions): string {
    const { fromKey, toKey, useFlats = false } = options;
    
    const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const chromaticScaleFlats = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    
    const scale = useFlats ? chromaticScaleFlats : chromaticScale;
    
    const fromIndex = this.getKeyIndex(fromKey, scale);
    const toIndex = this.getKeyIndex(toKey, scale);
    const interval = (toIndex - fromIndex + 12) % 12;

    return content.replace(/\[([^\]]+)\]/g, (match, chord) => {
      const transposedChord = this.transposeChord(chord, interval, scale);
      return `[${transposedChord}]`;
    });
  }

  private getKeyIndex(key: string, scale: string[]): number {
    const normalizedKey = key.replace('b', 'b').replace('#', '#');
    return scale.findIndex(note => note === normalizedKey) || 0;
  }

  private transposeChord(chord: string, interval: number, scale: string[]): string {
    // Handle complex chords (e.g., Am7, F#maj7, etc.)
    const chordRegex = /^([A-G][#b]?)(.*)$/;
    const match = chord.match(chordRegex);
    
    if (!match) return chord;
    
    const [, root, suffix] = match;
    const rootIndex = this.getKeyIndex(root, scale);
    const newRootIndex = (rootIndex + interval) % 12;
    const newRoot = scale[newRootIndex];
    
    return newRoot + suffix;
  }

  // Render ChordPro as HTML
  renderAsHTML(song: ParsedSong, options: { showChords: boolean; fontSize: number } = { showChords: true, fontSize: 14 }): string {
    let html = `
      <div class="chordpro-song" style="font-family: 'Courier New', monospace; font-size: ${options.fontSize}px; line-height: 1.6;">
        <div class="song-header" style="margin-bottom: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: ${options.fontSize + 6}px; font-weight: bold;">${song.title}</h2>
    `;

    if (song.artist) {
      html += `<p style="margin: 5px 0; font-style: italic; color: #666;">by ${song.artist}</p>`;
    }

    if (song.key || song.tempo || song.capo) {
      html += '<div style="margin: 10px 0; font-size: 12px; color: #888;">';
      if (song.key) html += `Key: ${song.key} `;
      if (song.tempo) html += `Tempo: ${song.tempo} BPM `;
      if (song.capo) html += `Capo: ${song.capo}`;
      html += '</div>';
    }

    html += '</div>';

    for (const section of song.sections) {
      html += `<div class="song-section" style="margin-bottom: 25px;">`;
      
      if (section.label) {
        html += `<h3 style="margin: 0 0 10px 0; font-size: ${options.fontSize + 2}px; color: #333; font-weight: bold;">${section.label}</h3>`;
      }

      for (const line of section.lines) {
        if (line.type === 'comment') {
          html += `<div style="color: #666; font-style: italic; margin: 5px 0;"># ${line.content}</div>`;
        } else if (line.type === 'chord' && options.showChords) {
          html += this.renderChordLine(line, options.fontSize);
        } else if (line.type === 'lyric' || (line.type === 'chord' && !options.showChords)) {
          html += `<div style="margin: 3px 0;">${line.content || '&nbsp;'}</div>`;
        }
      }

      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  private renderChordLine(line: ChordProLine, fontSize: number): string {
    if (!line.chords || line.chords.length === 0) {
      return `<div style="margin: 3px 0;">${line.content}</div>`;
    }

    let chordHtml = '<div style="position: relative; margin: 20px 0 3px 0;">';
    let lyricHtml = '<div style="margin: 0;">';

    // Create chord line
    let chordLine = '';
    let lastPos = 0;

    for (const chordPos of line.chords) {
      // Add spaces before chord
      chordLine += '&nbsp;'.repeat(Math.max(0, chordPos.position - lastPos));
      chordLine += `<span style="color: #0066cc; font-weight: bold;">${chordPos.chord}</span>`;
      lastPos = chordPos.position + chordPos.chord.length;
    }

    chordHtml += `<div style="font-size: ${fontSize - 1}px; color: #0066cc; font-weight: bold; margin-bottom: 2px;">${chordLine}</div>`;
    lyricHtml += line.content || '&nbsp;';

    return chordHtml + lyricHtml + '</div>';
  }

  // Export as PDF-ready HTML
  exportAsPDF(song: ParsedSong): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${song.title}</title>
        <style>
          @page { margin: 1in; }
          body { font-family: 'Courier New', monospace; font-size: 12pt; line-height: 1.4; }
          .song-header { text-align: center; margin-bottom: 30px; }
          .song-title { font-size: 18pt; font-weight: bold; margin-bottom: 10px; }
          .song-artist { font-style: italic; color: #666; margin-bottom: 10px; }
          .song-meta { font-size: 10pt; color: #888; }
          .song-section { margin-bottom: 25px; page-break-inside: avoid; }
          .section-label { font-weight: bold; font-size: 14pt; margin-bottom: 10px; }
          .chord-line { color: #0066cc; font-weight: bold; margin-bottom: 2px; }
          .lyric-line { margin-bottom: 3px; }
          .comment { color: #666; font-style: italic; }
        </style>
      </head>
      <body>
        ${this.renderAsHTML(song, { showChords: true, fontSize: 12 })}
      </body>
      </html>
    `;
  }

  // Save song to database
  async saveSong(song: Omit<ChordProSong, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return await supabaseService.saveSong(song);
  }

  // Get user's songs
  async getUserSongs(userId: string): Promise<ChordProSong[]> {
    return await supabaseService.getUserSongs(userId);
  }

  // Search songs
  async searchSongs(query: string, userId: string): Promise<ChordProSong[]> {
    return await supabaseService.searchSongs(query, userId);
  }

  // Update song
  async updateSong(songId: string, updates: Partial<ChordProSong>): Promise<void> {
    return await supabaseService.updateSong(songId, updates);
  }

  // Delete song
  async deleteSong(songId: string): Promise<void> {
    return await supabaseService.deleteSong(songId);
  }
}

export const chordProService = ChordProService.getInstance();