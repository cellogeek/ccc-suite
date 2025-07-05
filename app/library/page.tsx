'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Search, FileText, Download, Trash2, Eye, Filter } from "lucide-react";
import AuthButton from "../../components/AuthButton";
import { supabaseService } from "../../services/supabaseService";

interface PresentationData {
  id?: string;
  title: string;
  scriptureReference: string;
  slides: any[];
  complianceReport: any;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  tags: string[];
}

export default function LibraryPage() {
  const { data: session } = useSession();
  const [presentations, setPresentations] = useState<PresentationData[]>([]);
  const [filteredPresentations, setFilteredPresentations] = useState<PresentationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'reference'>('date');
  const [filterTag, setFilterTag] = useState('');
  const [selectedPresentation, setSelectedPresentation] = useState<PresentationData | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadPresentations();
  }, [session]);

  useEffect(() => {
    filterAndSortPresentations();
  }, [presentations, searchTerm, sortBy, filterTag]);

  const loadPresentations = async () => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const userPresentations = await supabaseService.getUserPresentations(session.user.id);
      setPresentations(userPresentations);
    } catch (error) {
      console.error('Error loading presentations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortPresentations = () => {
    let filtered = presentations.filter(p => {
      const matchesSearch = 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.scriptureReference.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTag = !filterTag || p.tags.includes(filterTag);
      
      return matchesSearch && matchesTag;
    });

    // Sort presentations
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'reference':
          return a.scriptureReference.localeCompare(b.scriptureReference);
        case 'date':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    setFilteredPresentations(filtered);
  };

  const deletePresentation = async (id?: string) => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this presentation?')) {
      return;
    }

    try {
      await supabaseService.deletePresentation(id);
      setPresentations(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting presentation:', error);
      alert('Error deleting presentation. Please try again.');
    }
  };

  const exportPresentation = async (presentation: PresentationData, format: 'rtf' | 'txt' | 'pro') => {
    setIsExporting(true);
    try {
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
      alert(`Error exporting ${format.toUpperCase()} file. Please try again.`);
    } finally {
      setIsExporting(false);
    }
  };

  const getAllTags = () => {
    const allTags = presentations.flatMap(p => p.tags);
    return [...new Set(allTags)].sort();
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <header className="glass-card mx-4 mt-4 p-6 animate-slide-down">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FileText className="w-8 h-8 text-primary-600" />
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
            <FileText className="w-16 h-16 mx-auto text-accent-400 mb-4" />
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
            <FileText className="w-8 h-8 text-primary-600" />
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Search and Filter Panel */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 animate-slide-up">
              <h2 className="text-xl font-semibold text-primary-800 mb-4 flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Search & Filter</span>
              </h2>

              <div className="space-y-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-accent-700 mb-2">
                    Search Presentations
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by title or reference..."
                    className="glass-input w-full px-4 py-3 text-accent-800 placeholder-accent-400"
                  />
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-accent-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'reference')}
                    className="glass-input w-full px-4 py-3"
                  >
                    <option value="date">Last Updated</option>
                    <option value="title">Title</option>
                    <option value="reference">Scripture Reference</option>
                  </select>
                </div>

                {/* Filter by Tag */}
                <div>
                  <label className="block text-sm font-medium text-accent-700 mb-2">
                    Filter by Tag
                  </label>
                  <select
                    value={filterTag}
                    onChange={(e) => setFilterTag(e.target.value)}
                    className="glass-input w-full px-4 py-3"
                  >
                    <option value="">All Tags</option>
                    {getAllTags().map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>

                {/* Results Count */}
                <div className="p-3 bg-primary-50/50 rounded-lg border border-primary-200/50">
                  <p className="text-sm text-primary-700">
                    Showing {filteredPresentations.length} of {presentations.length} presentations
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Presentations List */}
          <div className="lg:col-span-3">
            <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-xl font-semibold text-primary-800 mb-4">
                Your Presentations
              </h2>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-accent-600">Loading presentations...</p>
                </div>
              ) : filteredPresentations.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto text-accent-400 mb-4" />
                  <h3 className="text-lg font-semibold text-accent-800 mb-2">
                    {presentations.length === 0 ? 'No Presentations Yet' : 'No Matching Presentations'}
                  </h3>
                  <p className="text-accent-600">
                    {presentations.length === 0 
                      ? 'Create your first presentation to get started.'
                      : 'Try adjusting your search or filter criteria.'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPresentations.map((presentation) => (
                    <div
                      key={presentation.id}
                      className="p-6 rounded-lg border border-accent-200/50 bg-accent-50/30 hover:bg-primary-50/50 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-accent-800 mb-2">
                            {presentation.title}
                          </h3>
                          <p className="text-accent-600 mb-2">
                            {presentation.scriptureReference}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-accent-500 mb-3">
                            <span>{presentation.slides.length} slides</span>
                            <span>Updated {new Date(presentation.updatedAt).toLocaleDateString()}</span>
                            <span>Created {new Date(presentation.createdAt).toLocaleDateString()}</span>
                          </div>
                          {presentation.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {presentation.tags.map(tag => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => setSelectedPresentation(presentation)}
                            className="glass-button p-2 text-accent-600 hover:text-primary-600 transition-colors"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <div className="relative group">
                            <button
                              className="glass-button p-2 text-accent-600 hover:text-secondary-600 transition-colors"
                              title="Export"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-accent-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                              <div className="p-2 space-y-1 min-w-32">
                                <button
                                  onClick={() => exportPresentation(presentation, 'rtf')}
                                  disabled={isExporting}
                                  className="w-full text-left px-3 py-2 text-sm text-accent-700 hover:bg-primary-50 rounded transition-colors"
                                >
                                  RTF
                                </button>
                                <button
                                  onClick={() => exportPresentation(presentation, 'txt')}
                                  disabled={isExporting}
                                  className="w-full text-left px-3 py-2 text-sm text-accent-700 hover:bg-primary-50 rounded transition-colors"
                                >
                                  TXT
                                </button>
                                <button
                                  onClick={() => exportPresentation(presentation, 'pro')}
                                  disabled={isExporting}
                                  className="w-full text-left px-3 py-2 text-sm text-accent-700 hover:bg-primary-50 rounded transition-colors"
                                >
                                  PRO
                                </button>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => deletePresentation(presentation.id)}
                            className="glass-button p-2 text-accent-600 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Preview Modal */}
      {selectedPresentation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-accent-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-accent-800">
                    {selectedPresentation.title}
                  </h3>
                  <p className="text-accent-600">{selectedPresentation.scriptureReference}</p>
                </div>
                <button
                  onClick={() => setSelectedPresentation(null)}
                  className="text-accent-400 hover:text-accent-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {selectedPresentation.slides.map((slide, index) => (
                <div key={slide.id || index} className="slide-container p-8">
                  <div className="text-center">
                    <h4 className="text-2xl font-bold mb-4">{slide.title}</h4>
                    <div className="text-lg leading-relaxed whitespace-pre-line">
                      {slide.content}
                    </div>
                    <div className="mt-4 text-sm opacity-75">
                      Font Size: {slide.fontSize}pt | Verses: {slide.verseCount}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}