'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Presentation, Plus, Search, Book, Music, Eye, Download, Edit, Trash2 } from "lucide-react";
import AuthButton from "../../components/AuthButton";
import { supabaseService } from "../../services/supabaseService";
import { chordProService } from "../../services/chordProService";
import { scriptureService } from "../../services/scriptureService";
import { ChordProSong } from "../../types/chordpro";
import { Slide } from "../../types/scripture";

interface CombinedPresentation {
  id?: string;
  title: string;
  description?: string;
  items: PresentationItem[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PresentationItem {
  id: string;
  type: 'scripture' | 'song';
  order: number;
  title: string;
  content: any; // Scripture slides or ChordPro song
  notes?: string;
}

export default function PresentationsPage() {
  const { data: session } = useSession();
  const [presentations, setPresentations] = useState<CombinedPresentation[]>([]);
  const [songs, setSongs] = useState<ChordProSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPresentation, setSelectedPresentation] = useState<CombinedPresentation | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [itemPickerType, setItemPickerType] = useState<'scripture' | 'song'>('scripture');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [presentationItems, setPresentationItems] = useState<PresentationItem[]>([]);

  // Scripture form states
  const [scriptureReference, setScriptureReference] = useState('');
  const [fontSize, setFontSize] = useState(46);
  const [maxVerses, setMaxVerses] = useState(4);

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
      const userSongs = await chordProService.getUserSongs(session.user.id);
      setSongs(userSongs);
      // Load presentations would go here
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPresentation = () => {
    setSelectedPresentation(null);
    setIsEditing(true);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPresentationItems([]);
    setScriptureReference('');
  };

  const handleAddScripture = async () => {
    if (!scriptureReference.trim() || !session?.user?.id) return;

    try {
      const result = await scriptureService.generateSlides(scriptureReference, {
        fontSize,
        maxVersesPerSlide: maxVerses,
        userId: session.user.id
      });

      const newItem: PresentationItem = {
        id: `scripture-${Date.now()}`,
        type: 'scripture',
        order: presentationItems.length,
        title: scriptureReference,
        content: result.slides
      };

      setPresentationItems([...presentationItems, newItem]);
      setScriptureReference('');
      setShowItemPicker(false);
    } catch (error) {
      console.error('Error adding scripture:', error);
      alert('Error adding scripture. Please check your reference.');
    }
  };

  const handleAddSong = (song: ChordProSong) => {
    const newItem: PresentationItem = {
      id: `song-${song.id}-${Date.now()}`,
      type: 'song',
      order: presentationItems.length,
      title: song.title,
      content: song
    };

    setPresentationItems([...presentationItems, newItem]);
    setShowItemPicker(false);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = presentationItems.filter((_, i) => i !== index);
    // Reorder the remaining items
    const reorderedItems = updatedItems.map((item, i) => ({ ...item, order: i }));
    setPresentationItems(reorderedItems);
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= presentationItems.length) return;

    const updatedItems = [...presentationItems];
    [updatedItems[index], updatedItems[newIndex]] = [updatedItems[newIndex], updatedItems[index]];
    
    // Update order numbers
    updatedItems.forEach((item, i) => {
      item.order = i;
    });

    setPresentationItems(updatedItems);
  };

  const handleExportPresentation = (presentation: CombinedPresentation) => {
    try {
      let content = `# ${presentation.title}\n\n`;
      
      if (presentation.description) {
        content += `${presentation.description}\n\n`;
      }

      content += `## Presentation Order (${presentation.items.length} items)\n\n`;

      presentation.items.forEach((item, index) => {
        content += `### ${index + 1}. ${item.title} (${item.type})\n\n`;
        
        if (item.type === 'scripture') {
          const slides = item.content as Slide[];
          slides.forEach((slide, slideIndex) => {
            content += `**Slide ${slideIndex + 1}:**\n`;
            content += `${slide.content}\n\n`;
          });
        } else if (item.type === 'song') {
          const song = item.content as ChordProSong;
          content += `**Artist:** ${song.artist || 'Unknown'}\n`;
          if (song.key) content += `**Key:** ${song.key}\n`;
          if (song.tempo) content += `**Tempo:** ${song.tempo} BPM\n`;
          content += '\n```\n';
          content += song.content;
          content += '\n```\n\n';
        }

        if (item.notes) {
          content += `**Notes:** ${item.notes}\n\n`;
        }

        content += '---\n\n';
      });

      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${presentation.title.replace(/[^a-z0-9]/gi, '_')}_presentation.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting presentation:', error);
      alert('Error exporting presentation. Please try again.');
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Presentation className="mx-auto h-12 w-12 text-blue-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Combined Presentations</h1>
          <p className="text-gray-600 mb-8">Sign in to create presentations with scripture and songs</p>
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
          <p className="text-gray-600">Loading presentations...</p>
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
                {selectedPresentation ? 'Edit Presentation' : 'New Presentation'}
              </h1>
              <div className="space-x-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {/* handleSavePresentation */}}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Presentation
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Presentation Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Presentation Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Sunday Morning Service"
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

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setItemPickerType('scripture');
                      setShowItemPicker(true);
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Book size={20} />
                    <span>Add Scripture</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setItemPickerType('song');
                      setShowItemPicker(true);
                    }}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Music size={20} />
                    <span>Add Song</span>
                  </button>
                </div>
              </div>

              {/* Current Presentation Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Presentation Items ({presentationItems.length})
                </h3>
                
                {presentationItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Presentation className="mx-auto h-12 w-12 mb-2" />
                    <p>No items added yet</p>
                    <p className="text-sm">Add scripture or songs to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {presentationItems.map((item, index) => (
                      <div key={item.id} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                        <div className="flex-shrink-0">
                          {item.type === 'scripture' ? (
                            <Book className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Music className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-500 w-6">
                          {index + 1}.
                        </span>
                        <div className="flex-1">
                          <div className="font-medium">{item.title}</div>
                          <div className="text-sm text-gray-600 capitalize">{item.type}</div>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleMoveItem(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => handleMoveItem(index, 'down')}
                            disabled={index === presentationItems.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => handleRemoveItem(index)}
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

        {/* Item Picker Modal */}
        {showItemPicker && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-96 overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {itemPickerType === 'scripture' ? 'Add Scripture' : 'Choose a Song'}
                </h3>
                <button
                  onClick={() => setShowItemPicker(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              {itemPickerType === 'scripture' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scripture Reference
                    </label>
                    <input
                      type="text"
                      value={scriptureReference}
                      onChange={(e) => setScriptureReference(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., John 3:16, Psalm 23:1-6"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Font Size
                      </label>
                      <input
                        type="number"
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="20"
                        max="72"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Verses per Slide
                      </label>
                      <input
                        type="number"
                        value={maxVerses}
                        onChange={(e) => setMaxVerses(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max="8"
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={handleAddScripture}
                    disabled={!scriptureReference.trim()}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Add Scripture Slides
                  </button>
                </div>
              ) : (
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
                          onClick={() => handleAddSong(song)}
                          className="p-3 border border-gray-200 rounded-md hover:bg-green-50 cursor-pointer transition-colors"
                        >
                          <div className="font-medium">{song.title}</div>
                          {song.artist && (
                            <div className="text-sm text-gray-600">{song.artist}</div>
                          )}
                          {song.key && (
                            <div className="text-xs text-green-600">Key: {song.key}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Combined Presentations</h1>
            <p className="text-gray-600">Create presentations with scripture slides and worship songs</p>
          </div>
          <button
            onClick={handleNewPresentation}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>New Presentation</span>
          </button>
        </div>

        {/* Presentations Grid */}
        {presentations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Presentation className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No presentations found</h3>
            <p className="text-gray-600 mb-6">
              Create your first combined presentation with scripture and songs
            </p>
            <button
              onClick={handleNewPresentation}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Presentation
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {presentations.map((presentation) => (
              <div key={presentation.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{presentation.title}</h3>
                    {presentation.description && (
                      <p className="text-gray-600 mb-2 text-sm">{presentation.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => {/* handleViewPresentation(presentation) */}}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="View"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => {/* handleEditPresentation(presentation) */}}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleExportPresentation(presentation)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                      title="Export"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{presentation.items.length} items</span>
                  <span>Updated {presentation.updatedAt.toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
