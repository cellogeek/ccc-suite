'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Music, Plus, Search, Filter, Edit, Trash2, Eye, Download, Key, Clock, Guitar } from "lucide-react";
import AuthButton from "../../components/AuthButton";
import { chordProService } from "../../services/chordProService";
import { ChordProSong } from "../../types/chordpro";

export default function SongsPage() {
  const { data: session } = useSession();
  const [songs, setSongs] = useState<ChordProSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState<ChordProSong | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [key, setKey] = useState('');
  const [tempo, setTempo] = useState<number | ''>('');
  const [capo, setCapo] = useState<number | ''>('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      loadSongs();
    } else {
      setIsLoading(false);
    }
  }, [session]);

  const loadSongs = async () => {
    if (!session?.user?.id) return;

    try {
      const userSongs = await chordProService.getUserSongs(session.user.id);
      setSongs(userSongs);
    } catch (error) {
      console.error('Error loading songs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!session?.user?.id || !searchQuery.trim()) {
      loadSongs();
      return;
    }

    try {
      const searchResults = await chordProService.searchSongs(searchQuery, session.user.id);
      setSongs(searchResults);
    } catch (error) {
      console.error('Error searching songs:', error);
    }
  };

  const handleNewSong = () => {
    setSelectedSong(null);
    setIsEditing(true);
    resetForm();
  };

  const handleEditSong = (song: ChordProSong) => {
    setSelectedSong(song);
    setIsEditing(true);
    setTitle(song.title);
    setArtist(song.artist || '');
    setKey(song.key || '');
    setTempo(song.tempo || '');
    setCapo(song.capo || '');
    setContent(song.content);
    setTags(song.tags);
    setIsPublic(song.isPublic);
  };

  const handlePreviewSong = (song: ChordProSong) => {
    setSelectedSong(song);
    setShowPreview(true);
  };

  const resetForm = () => {
    setTitle('');
    setArtist('');
    setKey('');
    setTempo('');
    setCapo('');
    setContent('');
    setTags([]);
    setIsPublic(false);
  };

  const handleSaveSong = async () => {
    if (!session?.user?.id || !title.trim() || !content.trim()) {
      alert('Please fill in title and content');
      return;
    }

    try {
      const songData: Omit<ChordProSong, 'id' | 'createdAt' | 'updatedAt'> = {
        title: title.trim(),
        artist: artist.trim() || undefined,
        key: key.trim() || undefined,
        tempo: typeof tempo === 'number' ? tempo : undefined,
        capo: typeof capo === 'number' ? capo : undefined,
        content: content.trim(),
        tags,
        userId: session.user.id,
        isPublic
      };

      await chordProService.saveSong(songData);
      setIsEditing(false);
      resetForm();
      loadSongs();
      alert('Song saved successfully!');
    } catch (error) {
      console.error('Error saving song:', error);
      alert('Error saving song. Please try again.');
    }
  };

  const handleExportSong = (song: ChordProSong, format: 'html' | 'pdf' | 'txt') => {
    try {
      const parsedSong = chordProService.parseChordPro(song.content);
      
      let content: string;
      let mimeType: string;
      let filename: string;

      switch (format) {
        case 'html':
          content = chordProService.renderAsHTML(parsedSong);
          mimeType = 'text/html';
          filename = `${song.title.replace(/[^a-z0-9]/gi, '_')}.html`;
          break;
        case 'pdf':
          content = chordProService.exportAsPDF(parsedSong);
          mimeType = 'text/html';
          filename = `${song.title.replace(/[^a-z0-9]/gi, '_')}_pdf.html`;
          break;
        case 'txt':
          content = song.content;
          mimeType = 'text/plain';
          filename = `${song.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
          break;
        default:
          return;
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
    } catch (error) {
      console.error('Error exporting song:', error);
      alert('Error exporting song. Please try again.');
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Music className="mx-auto h-12 w-12 text-blue-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">ChordPro Song Library</h1>
          <p className="text-gray-600 mb-8">Sign in to manage your worship songs and chord charts</p>
          <AuthButton />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your song library...</p>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                {selectedSong ? 'Edit Song' : 'New Song'}
              </h1>
              <div className="space-x-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSong}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Song
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Song Metadata */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Song title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Artist
                  </label>
                  <input
                    type="text"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Artist name"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Key
                    </label>
                    <select
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select key</option>
                      {['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'].map(k => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tempo
                    </label>
                    <input
                      type="number"
                      value={tempo}
                      onChange={(e) => setTempo(e.target.value ? parseInt(e.target.value) : '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="BPM"
                      min="60"
                      max="200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Capo
                    </label>
                    <input
                      type="number"
                      value={capo}
                      onChange={(e) => setCapo(e.target.value ? parseInt(e.target.value) : '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Fret"
                      min="0"
                      max="12"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Make this song public</span>
                  </label>
                </div>
              </div>

              {/* ChordPro Help */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">ChordPro Format Help</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>Chords:</strong> Place chords in brackets above lyrics</p>
                  <p className="font-mono bg-white p-2 rounded">
                    [G]Amazing [C]grace how [G]sweet the sound<br/>
                    That [G]saved a [D]wretch like [G]me
                  </p>
                  <p><strong>Sections:</strong> Use labels for song parts</p>
                  <p className="font-mono bg-white p-2 rounded">
                    {'{verse 1}'}<br/>
                    {'{chorus}'}<br/>
                    {'{bridge}'}
                  </p>
                  <p><strong>Comments:</strong> Use # for notes</p>
                  <p className="font-mono bg-white p-2 rounded"># Play softly here</p>
                </div>
              </div>
            </div>

            {/* ChordPro Content */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ChordPro Content *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="Enter your ChordPro formatted song here..."
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showPreview && selectedSong) {
    const parsedSong = chordProService.parseChordPro(selectedSong.content);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Song Preview</h1>
              <div className="space-x-2">
                <button
                  onClick={() => handleExportSong(selectedSong, 'html')}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Export HTML
                </button>
                <button
                  onClick={() => handleExportSong(selectedSong, 'pdf')}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Export PDF
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Back to Library
                </button>
              </div>
            </div>

            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: chordProService.renderAsHTML(parsedSong, { showChords: true, fontSize: 14 })
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Song Library</h1>
            <p className="text-gray-600">Manage your ChordPro worship songs and chord charts</p>
          </div>
          <button
            onClick={handleNewSong}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>New Song</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search songs by title, artist, or content..."
                />
              </div>
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
            <button
              onClick={loadSongs}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Show All
            </button>
          </div>
        </div>

        {/* Songs Grid */}
        {songs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Music className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No songs found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery ? 'Try a different search term or' : 'Get started by creating your first song'}
            </p>
            <button
              onClick={handleNewSong}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Song
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {songs.map((song) => (
              <div key={song.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{song.title}</h3>
                    {song.artist && (
                      <p className="text-gray-600 mb-2">by {song.artist}</p>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handlePreviewSong(song)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Preview"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleEditSong(song)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleExportSong(song, 'html')}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                      title="Export"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {song.key && (
                    <span className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      <Key size={12} />
                      <span>{song.key}</span>
                    </span>
                  )}
                  {song.tempo && (
                    <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      <Clock size={12} />
                      <span>{song.tempo} BPM</span>
                    </span>
                  )}
                  {song.capo && (
                    <span className="inline-flex items-center space-x-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                      <Guitar size={12} />
                      <span>Capo {song.capo}</span>
                    </span>
                  )}
                </div>

                <div className="text-sm text-gray-500">
                  Updated {song.updatedAt.toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}