'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Calendar, Plus, Search, Music, Edit, Trash2, Eye, Download, ArrowUp, ArrowDown } from "lucide-react";
import AuthButton from "../../components/AuthButton";
import { chordProService } from "../../services/chordProService";
import { ChordProSong, Setlist, SetlistSong } from "../../types/chordpro";

export default function SetlistsPage() {
  const { data: session } = useSession();
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [songs, setSongs] = useState<ChordProSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSetlist, setSelectedSetlist] = useState<Setlist | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showSongPicker, setShowSongPicker] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [serviceDate, setServiceDate] = useState('');
  const [setlistSongs, setSetlistSongs] = useState<SetlistSong[]>([]);

  useEffect(() => {
    if (session?.user?.id) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [session]);

  const loadData = async () => {
    if (!session?.user?.id) return;

    try {
      // Load both setlists and songs
      const [userSetlists, userSongs] = await Promise.all([
        loadSetlists(),
        chordProService.getUserSongs(session.user.id)
      ]);
      setSongs(userSongs);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSetlists = async () => {
    // This would be implemented in the chordProService
    // For now, return empty array
    return [];
  };

  const handleNewSetlist = () => {
    setSelectedSetlist(null);
    setIsEditing(true);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setServiceDate('');
    setSetlistSongs([]);
  };

  const handleAddSongToSetlist = (song: ChordProSong) => {
    const newSetlistSong: SetlistSong = {
      songId: song.id!,
      order: setlistSongs.length,
      song: song
    };
    setSetlistSongs([...setlistSongs, newSetlistSong]);
    setShowSongPicker(false);
  };

  const handleRemoveSongFromSetlist = (index: number) => {
    const updatedSongs = setlistSongs.filter((_, i) => i !== index);
    // Reorder the remaining songs
    const reorderedSongs = updatedSongs.map((song, i) => ({ ...song, order: i }));
    setSetlistSongs(reorderedSongs);
  };

  const handleMoveSong = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= setlistSongs.length) return;

    const updatedSongs = [...setlistSongs];
    [updatedSongs[index], updatedSongs[newIndex]] = [updatedSongs[newIndex], updatedSongs[index]];
    
    // Update order numbers
    updatedSongs.forEach((song, i) => {
      song.order = i;
    });

    setSetlistSongs(updatedSongs);
  };

  const handleExportSetlist = (setlist: Setlist) => {
    try {
      let content = `# ${setlist.title}\n\n`;
      
      if (setlist.description) {
        content += `${setlist.description}\n\n`;
      }
      
      if (setlist.date) {
        content += `Date: ${setlist.date.toLocaleDateString()}\n\n`;
      }

      content += `## Songs (${setlist.songs.length})\n\n`;

      setlist.songs.forEach((setlistSong, index) => {
        const song = setlistSong.song;
        if (song) {
          content += `${index + 1}. **${song.title}**`;
          if (song.artist) content += ` - ${song.artist}`;
          if (setlistSong.key || song.key) content += ` (Key: ${setlistSong.key || song.key})`;
          content += '\n';
          if (setlistSong.notes) content += `   Notes: ${setlistSong.notes}\n`;
          content += '\n';
        }
      });

      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${setlist.title.replace(/[^a-z0-9]/gi, '_')}_setlist.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting setlist:', error);
      alert('Error exporting setlist. Please try again.');
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="mx-auto h-12 w-12 text-blue-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Worship Setlists</h1>
          <p className="text-gray-600 mb-8">Sign in to plan your worship services</p>
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
          <p className="text-gray-600">Loading your setlists...</p>
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
                {selectedSetlist ? 'Edit Setlist' : 'New Setlist'}
              </h1>
              <div className="space-x-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {/* handleSaveSetlist */}}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Setlist
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Setlist Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Setlist Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Sunday Morning Worship"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Service theme or notes..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Date
                  </label>
                  <input
                    type="date"
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={() => setShowSongPicker(true)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus size={20} />
                  <span>Add Song to Setlist</span>
                </button>
              </div>

              {/* Current Setlist */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Songs in Setlist ({setlistSongs.length})
                </h3>
                
                {setlistSongs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Music className="mx-auto h-12 w-12 mb-2" />
                    <p>No songs added yet</p>
                    <p className="text-sm">Click "Add Song" to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {setlistSongs.map((setlistSong, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                        <span className="text-sm font-medium text-gray-500 w-6">
                          {index + 1}.
                        </span>
                        <div className="flex-1">
                          <div className="font-medium">{setlistSong.song?.title}</div>
                          {setlistSong.song?.artist && (
                            <div className="text-sm text-gray-600">{setlistSong.song.artist}</div>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleMoveSong(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            onClick={() => handleMoveSong(index, 'down')}
                            disabled={index === setlistSongs.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          >
                            <ArrowDown size={16} />
                          </button>
                          <button
                            onClick={() => handleRemoveSongFromSetlist(index)}
                            className="p-1 text-red-400 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Song Picker Modal */}
        {showSongPicker && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-96 overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Choose a Song</h3>
                <button
                  onClick={() => setShowSongPicker(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="overflow-y-auto max-h-80">
                {songs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Music className="mx-auto h-12 w-12 mb-2" />
                    <p>No songs available</p>
                    <p className="text-sm">Create some songs first</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {songs.map((song) => (
                      <div
                        key={song.id}
                        onClick={() => handleAddSongToSetlist(song)}
                        className="p-3 border border-gray-200 rounded-md hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <div className="font-medium">{song.title}</div>
                        {song.artist && (
                          <div className="text-sm text-gray-600">{song.artist}</div>
                        )}
                        {song.key && (
                          <div className="text-xs text-blue-600">Key: {song.key}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Worship Setlists</h1>
            <p className="text-gray-600">Plan and organize your worship services</p>
          </div>
          <button
            onClick={handleNewSetlist}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>New Setlist</span>
          </button>
        </div>

        {/* Setlists Grid */}
        {setlists.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No setlists found</h3>
            <p className="text-gray-600 mb-6">
              Create your first setlist to start planning worship services
            </p>
            <button
              onClick={handleNewSetlist}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Setlist
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {setlists.map((setlist) => (
              <div key={setlist.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{setlist.title}</h3>
                    {setlist.description && (
                      <p className="text-gray-600 mb-2 text-sm">{setlist.description}</p>
                    )}
                    {setlist.date && (
                      <p className="text-blue-600 text-sm font-medium">
                        {setlist.date.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => {/* handleViewSetlist(setlist) */}}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="View"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => {/* handleEditSetlist(setlist) */}}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleExportSetlist(setlist)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                      title="Export"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{setlist.songs.length} songs</span>
                  <span>Updated {setlist.updatedAt.toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}