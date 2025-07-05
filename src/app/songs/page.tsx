'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Music, Upload, Download, Settings, Eye, Save } from "lucide-react";
import AuthButton from "../../components/AuthButton";

interface ChordProSong {
  id: string;
  title: string;
  artist: string;
  key: string;
  tempo?: string;
  content: string;
  chords: string[];
  createdAt: string;
}

export default function SongsPage() {
  const { data: session } = useSession();
  const [chordProContent, setChordProContent] = useState('');
  const [parsedSong, setParsedSong] = useState<ChordProSong | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedKey, setSelectedKey] = useState('C');
  const [transposedContent, setTransposedContent] = useState('');
  const [savedSongs, setSavedSongs] = useState<ChordProSong[]>([]);

  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Sample ChordPro content for demonstration
  const sampleChordPro = `{title: Amazing Grace}
{artist: John Newton}
{key: G}
{tempo: 90}

[G]Amazing [G7]grace how [C]sweet the [G]sound
That saved a [Em]wretch like [D]me
[G]I once was [G7]lost but [C]now I'm [G]found
Was blind but [D]now I [G]see

{start_of_chorus}
[G]'Twas grace that [G7]taught my [C]heart to [G]fear
And grace my [Em]fears re[D]lieved
[G]How precious [G7]did that [C]grace ap[G]pear
The hour I [D]first be[G]lieved
{end_of_chorus}`;

  useEffect(() => {
    // Load saved songs from localStorage
    const saved = localStorage.getItem('savedSongs');
    if (saved) {
      setSavedSongs(JSON.parse(saved));
    }
  }, []);

  const parseChordPro = (content: string): ChordProSong | null => {
    if (!content.trim()) return null;

    const lines = content.split('\n');
    let title = '';
    let artist = '';
    let key = '';
    let tempo = '';
    const chords: Set<string> = new Set();
    
    // Extract metadata
    lines.forEach(line => {
      const titleMatch = line.match(/\{title:\s*(.+)\}/i);
      const artistMatch = line.match(/\{artist:\s*(.+)\}/i);
      const keyMatch = line.match(/\{key:\s*(.+)\}/i);
      const tempoMatch = line.match(/\{tempo:\s*(.+)\}/i);
      
      if (titleMatch) title = titleMatch[1];
      if (artistMatch) artist = artistMatch[1];
      if (keyMatch) key = keyMatch[1];
      if (tempoMatch) tempo = tempoMatch[1];
      
      // Extract chords
      const chordMatches = line.match(/\[([^\]]+)\]/g);
      if (chordMatches) {
        chordMatches.forEach(match => {
          const chord = match.replace(/[\[\]]/g, '');
          chords.add(chord);
        });
      }
    });

    return {
      id: Date.now().toString(),
      title: title || 'Untitled',
      artist: artist || 'Unknown',
      key: key || 'C',
      tempo,
      content,
      chords: Array.from(chords),
      createdAt: new Date().toISOString()
    };
  };

  const transposeChord = (chord: string, fromKey: string, toKey: string): string => {
    const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const fromIndex = chromaticScale.indexOf(fromKey);
    const toIndex = chromaticScale.indexOf(toKey);
    const interval = (toIndex - fromIndex + 12) % 12;
    
    // Simple chord transposition (basic implementation)
    const chordRoot = chord.match(/^[A-G][#b]?/)?.[0];
    if (!chordRoot) return chord;
    
    const rootIndex = chromaticScale.indexOf(chordRoot.replace('b', '#'));
    if (rootIndex === -1) return chord;
    
    const newRootIndex = (rootIndex + interval) % 12;
    const newRoot = chromaticScale[newRootIndex];
    
    return chord.replace(chordRoot, newRoot);
  };

  const transposeContent = (content: string, fromKey: string, toKey: string): string => {
    return content.replace(/\[([^\]]+)\]/g, (match, chord) => {
      const transposedChord = transposeChord(chord, fromKey, toKey);
      return `[${transposedChord}]`;
    });
  };

  const handleImport = () => {
    setIsLoading(true);
    try {
      const song = parseChordPro(chordProContent);
      if (song) {
        setParsedSong(song);
        setSelectedKey(song.key);
        setTransposedContent(song.content);
      }
    } catch (error) {
      console.error('Error parsing ChordPro:', error);
      alert('Error parsing ChordPro content. Please check the format.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranspose = (newKey: string) => {
    if (!parsedSong) return;
    
    setSelectedKey(newKey);
    const transposed = transposeContent(parsedSong.content, parsedSong.key, newKey);
    setTransposedContent(transposed);
  };

  const saveSong = () => {
    if (!parsedSong) return;
    
    const songToSave = {
      ...parsedSong,
      key: selectedKey,
      content: transposedContent
    };
    
    const updatedSongs = [...savedSongs, songToSave];
    setSavedSongs(updatedSongs);
    localStorage.setItem('savedSongs', JSON.stringify(updatedSongs));
    
    alert('Song saved successfully!');
  };

  const exportSong = (format: 'chordpro' | 'txt' | 'pro') => {
    if (!parsedSong) return;
    
    let content = '';
    let filename = '';
    let mimeType = '';
    
    switch (format) {
      case 'chordpro':
        content = transposedContent;
        filename = `${parsedSong.title.replace(/[^a-zA-Z0-9]/g, '_')}.cho`;
        mimeType = 'text/plain';
        break;
      case 'txt':
        // Remove chord annotations for plain text
        content = transposedContent.replace(/\[([^\]]+)\]/g, '');
        filename = `${parsedSong.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
        mimeType = 'text/plain';
        break;
      case 'pro':
        // Basic ProPresenter format (simplified)
        content = `<?xml version="1.0" encoding="UTF-8"?>
<RVPresentationDocument>
  <slides>
    ${transposedContent.split('\n\n').map((verse, index) => `
    <RVDisplaySlide>
      <displayElements>
        <RVTextElement>
          <plainText>${verse.replace(/\[([^\]]+)\]/g, '')}</plainText>
        </RVTextElement>
      </displayElements>
    </RVDisplaySlide>`).join('')}
  </slides>
</RVPresentationDocument>`;
        filename = `${parsedSong.title.replace(/[^a-zA-Z0-9]/g, '_')}.pro`;
        mimeType = 'application/xml';
        break;
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="glass-card mx-4 mt-4 p-6 animate-slide-down">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Music className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="church-header">Song Management</h1>
              <p className="text-accent-600 text-sm">ChordPro Import & Chord Transposition</p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <AuthButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Import Panel */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 animate-slide-up">
              <h2 className="text-xl font-semibold text-primary-800 mb-4 flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>ChordPro Import</span>
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="chordpro" className="block text-sm font-medium text-accent-700 mb-2">
                    Paste ChordPro Content
                  </label>
                  <textarea
                    id="chordpro"
                    value={chordProContent}
                    onChange={(e) => setChordProContent(e.target.value)}
                    placeholder="Paste your ChordPro formatted song here..."
                    rows={12}
                    className="glass-input w-full px-4 py-3 text-accent-800 placeholder-accent-400 font-mono text-sm"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={handleImport}
                    disabled={isLoading || !chordProContent.trim()}
                    className="glass-button flex-1 px-4 py-3 text-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent"></div>
                        <span>Parsing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Upload className="w-4 h-4" />
                        <span>Import</span>
                      </div>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setChordProContent(sampleChordPro)}
                    className="glass-button px-4 py-3 text-accent-700 font-medium"
                  >
                    Sample
                  </button>
                </div>
              </div>

              {/* Transpose Controls */}
              {parsedSong && (
                <div className="mt-6 p-4 bg-secondary-50/50 rounded-lg border border-secondary-200/50">
                  <h3 className="text-sm font-semibold text-secondary-800 mb-3 flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>Transpose</span>
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-secondary-700 mb-1">
                        Original Key: {parsedSong.key}
                      </label>
                      <label className="block text-xs font-medium text-secondary-700 mb-2">
                        Transpose to:
                      </label>
                      <select
                        value={selectedKey}
                        onChange={(e) => handleTranspose(e.target.value)}
                        className="glass-input w-full px-3 py-2 text-sm"
                      >
                        {keys.map(key => (
                          <option key={key} value={key}>{key}</option>
                        ))}
                      </select>
                    </div>
                    
                    {parsedSong.chords.length > 0 && (
                      <div>
                        <label className="block text-xs font-medium text-secondary-700 mb-1">
                          Chords Used:
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {parsedSong.chords.map(chord => (
                            <span key={chord} className="px-2 py-1 bg-secondary-100 text-secondary-800 rounded text-xs">
                              {transposeChord(chord, parsedSong.key, selectedKey)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Export Options */}
            {parsedSong && (
              <div className="glass-card p-6 mt-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
                <h2 className="text-xl font-semibold text-primary-800 mb-4 flex items-center space-x-2">
                  <Download className="w-5 h-5" />
                  <span>Export Options</span>
                </h2>
                
                <div className="space-y-3">
                  <button
                    onClick={saveSong}
                    className="glass-button w-full px-4 py-3 text-left text-secondary-700 hover:text-primary-700 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <Save className="w-4 h-4" />
                      <span>Save Song</span>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => exportSong('chordpro')}
                    className="glass-button w-full px-4 py-3 text-left text-accent-700 hover:text-primary-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span>ChordPro (.cho)</span>
                      <span className="text-xs text-accent-500">Original</span>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => exportSong('txt')}
                    className="glass-button w-full px-4 py-3 text-left text-accent-700 hover:text-primary-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span>Text (.txt)</span>
                      <span className="text-xs text-accent-500">Lyrics Only</span>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => exportSong('pro')}
                    className="glass-button w-full px-4 py-3 text-left text-accent-700 hover:text-primary-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span>ProPresenter (.pro)</span>
                      <span className="text-xs text-accent-500">Slides</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6 animate-slide-up" style={{animationDelay: '0.2s'}}>
              <h2 className="text-xl font-semibold text-primary-800 mb-4 flex items-center space-x-2">
                <Eye className="w-5 h-5" />
                <span>Song Preview</span>
              </h2>
              
              {!parsedSong ? (
                <div className="slide-container flex items-center justify-center">
                  <div className="text-center text-white/70">
                    <div className="mb-4">
                      <Music className="w-16 h-16 mx-auto opacity-50" />
                    </div>
                    <p className="text-lg">Import a ChordPro song to see preview</p>
                    <p className="text-sm mt-2 opacity-75">Supports chord transposition and multiple export formats</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Song Info */}
                  <div className="bg-primary-50/50 rounded-lg p-4 border border-primary-200/50">
                    <h3 className="text-lg font-bold text-primary-800">{parsedSong.title}</h3>
                    <p className="text-primary-600">by {parsedSong.artist}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-primary-700">
                      <span>Key: {selectedKey}</span>
                      {parsedSong.tempo && <span>Tempo: {parsedSong.tempo} BPM</span>}
                    </div>
                  </div>
                  
                  {/* Song Content */}
                  <div className="slide-container p-8">
                    <div className="text-center">
                      <pre className="text-lg leading-relaxed whitespace-pre-wrap font-mono">
                        {transposedContent.replace(/\{[^}]+\}/g, '').trim()}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Saved Songs */}
            {savedSongs.length > 0 && (
              <div className="glass-card p-6 mt-6 animate-slide-up" style={{animationDelay: '0.3s'}}>
                <h2 className="text-xl font-semibold text-primary-800 mb-4">
                  Saved Songs ({savedSongs.length})
                </h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {savedSongs.map((song) => (
                    <div key={song.id} className="flex items-center justify-between p-3 bg-accent-50/50 rounded-lg border border-accent-200/50">
                      <div>
                        <h4 className="font-medium text-accent-800">{song.title}</h4>
                        <p className="text-sm text-accent-600">{song.artist} - Key: {song.key}</p>
                      </div>
                      <button
                        onClick={() => {
                          setChordProContent(song.content);
                          setParsedSong(song);
                          setSelectedKey(song.key);
                          setTransposedContent(song.content);
                        }}
                        className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                      >
                        Load
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}