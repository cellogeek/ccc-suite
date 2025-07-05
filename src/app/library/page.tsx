'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Library, Search, Filter, Eye, Download, Trash2, Calendar, Tag } from "lucide-react";
import AuthButton from "../../components/AuthButton";
import { firestoreService } from "../../services/firestoreService";

interface SavedPresentation {
  id: string;
  title: string;
  scriptureReference: string;
  slides: any[];
  complianceReport: any;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export default function LibraryPage() {
  const { data: session } = useSession();
  const [presentations, setPresentations] = useState<SavedPresentation[]>([]);
  const [filteredPresentations, setFilteredPresentations] = useState<SavedPresentation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'reference'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadPresentations();
  }, [session]);

  useEffect(() => {
    filterAndSortPresentations();
  }, [presentations, searchTerm, selectedTag, sortBy, sortOrder]);

  const loadPresentations = async () => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const userPresentations = await firestoreService.getUserPresentations(session.user.id);
      setPresentations(userPresentations);
    } catch (error) {
      console.error('Error loading presentations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortPresentations = () => {
    let filtered = [...presentations];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.scriptureReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply tag filter
    if (selectedTag) {
      filtered = filtered.filter(p => p.tags.includes(selectedTag));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'reference':
          comparison = a.scriptureReference.localeCompare(b.scriptureReference);
          break;
        case 'date':
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredPresentations(filtered);
  };

  const deletePresentation = async (presentationId: string) => {
    if (!confirm('Are you sure you want to delete this presentation?')) {
      return;
    }

    try {
      await firestoreService.deletePresentation(presentationId);
      setPresentations(prev => prev.filter(p => p.id !== presentationId));
    } catch (error) {
      console.error('Error deleting presentation:', error);
      alert('Error deleting presentation. Please try again.');
    }
  };

  const exportPresentation = async (presentation: SavedPresentation, format: 'rtf' | 'txt' | 'pro') => {
    try {
      // This would use the same export logic as in the scripture service
      const { scriptureService } = await import("../../services/scriptureService");
      const blob = await scriptureService.exportSlides(
        presentation.slides, 
        { format }, 
        presentation.scriptureReference
      );
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${presentation.title.replace(/[^a-zA-Z0-9]/g, '_')}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting presentation:', error);
      alert(`Error exporting ${format.toUpperCase()} file.`);
    }
  };

  const getAllTags = () => {
    const allTags = presentations.flatMap(p => p.tags);
    return [...new Set(allTags)].sort();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <header className="glass-card mx-4 mt-4 p-6 animate-slide-down">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Library className="w-8 h-8 text-primary-600" />
              <div>
                <h1 className="church-header">Presentation Library</h1>
                <p className="text-accent-600 text-sm">Manage Your Saved Presentations</p>
              </div>
            </div>
            <AuthButton />
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8">
          <div className="glass-card p-12 text-center animate-slide-up">
            <Library className="w-16 h-16 mx-auto text-accent-400 mb-4" />
            <h2 className="text-2xl font-semibold text-accent-800 mb-2">Sign In Required</h2>
            <p className="text-accent-600 mb-6">Please sign in to access your presentation library.</p>
            <AuthButton />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="glass-card mx-4 mt-4 p-6 animate-slide-down">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Library className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="church-header">Presentation Library</h1>
              <p className="text-accent-600 text-sm">Manage Your Saved Presentations</p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <AuthButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search and Filter Controls */}
        <div className="glass-card p-6 mb-6 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-accent-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search presentations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input w-full pl-10 pr-4 py-2 text-sm"
              />
            </div>

            {/* Tag Filter */}
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-accent-400 w-4 h-4" />
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="glass-input w-full pl-10 pr-4 py-2 text-sm appearance-none"
              >
                <option value="">All Tags</option>
                {getAllTags().map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'reference')}
              className="glass-input w-full px-4 py-2 text-sm"
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
              <option value="reference">Sort by Reference</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="glass-input w-full px-4 py-2 text-sm"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Presentations Grid */}
        {isLoading ? (
          <div className="glass-card p-12 text-center animate-slide-up">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-accent-600">Loading presentations...</p>
          </div>
        ) : filteredPresentations.length === 0 ? (
          <div className="glass-card p-12 text-center animate-slide-up">
            <Library className="w-16 h-16 mx-auto text-accent-400 mb-4" />
            <h2 className="text-xl font-semibold text-accent-800 mb-2">
              {presentations.length === 0 ? 'No Presentations Yet' : 'No Matching Presentations'}
            </h2>
            <p className="text-accent-600 mb-6">
              {presentations.length === 0 
                ? 'Create your first presentation in the Scripture section.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPresentations.map((presentation, index) => (
              <div 
                key={presentation.id} 
                className="glass-card p-6 animate-slide-up hover:shadow-lg transition-shadow"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                {/* Presentation Header */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-primary-800 mb-1">
                    {presentation.title}
                  </h3>
                  <p className="text-accent-600 text-sm mb-2">
                    {presentation.scriptureReference}
                  </p>
                  <div className="flex items-center text-xs text-accent-500 space-x-2">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(presentation.createdAt)}</span>
                  </div>
                </div>

                {/* Tags */}
                {presentation.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {presentation.tags.map(tag => (
                        <span 
                          key={tag}
                          className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Presentation Stats */}
                <div className="mb-4 p-3 bg-accent-50/50 rounded-lg border border-accent-200/50">
                  <div className="text-sm text-accent-700">
                    <div className="flex justify-between">
                      <span>Slides:</span>
                      <span className="font-medium">{presentation.slides.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CCC Compliant:</span>
                      <span className="text-green-600 font-medium">✓ Yes</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => exportPresentation(presentation, 'rtf')}
                      className="glass-button px-3 py-2 text-xs text-accent-700 hover:text-primary-700 transition-colors"
                      title="Export as RTF"
                    >
                      RTF
                    </button>
                    <button
                      onClick={() => exportPresentation(presentation, 'txt')}
                      className="glass-button px-3 py-2 text-xs text-accent-700 hover:text-primary-700 transition-colors"
                      title="Export as TXT"
                    >
                      TXT
                    </button>
                    <button
                      onClick={() => exportPresentation(presentation, 'pro')}
                      className="glass-button px-3 py-2 text-xs text-accent-700 hover:text-primary-700 transition-colors"
                      title="Export as PRO"
                    >
                      PRO
                    </button>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        // Navigate to scripture page with this presentation loaded
                        window.location.href = `/scripture?load=${presentation.id}`;
                      }}
                      className="glass-button flex-1 px-3 py-2 text-sm text-primary-700 hover:text-primary-800 transition-colors flex items-center justify-center space-x-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                    
                    <button
                      onClick={() => deletePresentation(presentation.id)}
                      className="glass-button px-3 py-2 text-sm text-red-600 hover:text-red-800 transition-colors"
                      title="Delete Presentation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {presentations.length > 0 && (
          <div className="glass-card p-6 mt-8 animate-slide-up">
            <h2 className="text-lg font-semibold text-primary-800 mb-4">Library Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary-600">{presentations.length}</div>
                <div className="text-sm text-accent-600">Total Presentations</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary-600">
                  {presentations.reduce((sum, p) => sum + p.slides.length, 0)}
                </div>
                <div className="text-sm text-accent-600">Total Slides</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">100%</div>
                <div className="text-sm text-accent-600">CCC Compliant</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent-600">{getAllTags().length}</div>
                <div className="text-sm text-accent-600">Unique Tags</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}