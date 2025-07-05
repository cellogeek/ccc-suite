'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Download, FileText, Settings, CheckSquare, Square, Archive } from "lucide-react";
import AuthButton from "../../components/AuthButton";
import { firestoreService } from "../../services/firestoreService";

interface ExportablePresentation {
  id: string;
  title: string;
  scriptureReference: string;
  slides: any[];
  selected: boolean;
  createdAt: string;
}

export default function ExportPage() {
  const { data: session } = useSession();
  const [presentations, setPresentations] = useState<ExportablePresentation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'rtf' | 'txt' | 'pro'>('rtf');
  const [exportType, setExportType] = useState<'individual' | 'combined' | 'archive'>('individual');
  const [castrTitle, setCastrTitle] = useState('');
  const [castrDescription, setCastrDescription] = useState('');

  useEffect(() => {
    loadPresentations();
  }, [session]);

  const loadPresentations = async () => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const userPresentations = await firestoreService.getUserPresentations(session.user.id);
      setPresentations(userPresentations.map(p => ({ ...p, selected: false })));
    } catch (error) {
      console.error('Error loading presentations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setPresentations(prev => 
      prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p)
    );
  };

  const selectAll = () => {
    const allSelected = presentations.every(p => p.selected);
    setPresentations(prev => 
      prev.map(p => ({ ...p, selected: !allSelected }))
    );
  };

  const getSelectedPresentations = () => {
    return presentations.filter(p => p.selected);
  };

  const generateCastrContent = () => {
    const selected = getSelectedPresentations();
    if (selected.length === 0) return;

    const references = selected.map(p => p.scriptureReference).join(', ');
    const title = selected.length === 1 
      ? `Scripture: ${selected[0].scriptureReference}`
      : `Scripture Study: ${references}`;
    
    const description = `Join us for today's scripture presentation featuring ${references}. 
    
Presented by Canyon Country Freewill Baptist Church Media Team.
Generated with CCC Suite - 100% CCC Rule Compliant Scripture Slides.

#Scripture #Church #Bible #CanyonCountry #FreewillBaptist`;

    setCastrTitle(title);
    setCastrDescription(description);
  };

  const exportSelected = async () => {
    const selected = getSelectedPresentations();
    if (selected.length === 0) {
      alert('Please select at least one presentation to export.');
      return;
    }

    setIsExporting(true);
    
    try {
      const { scriptureService } = await import("../../services/scriptureService");
      
      if (exportType === 'individual') {
        // Export each presentation as a separate file
        for (const presentation of selected) {
          const blob = await scriptureService.exportSlides(
            presentation.slides,
            { format: exportFormat },
            presentation.scriptureReference
          );
          
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${presentation.title.replace(/[^a-zA-Z0-9]/g, '_')}.${exportFormat}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          // Small delay between downloads
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } else if (exportType === 'combined') {
        // Combine all slides into one file
        const allSlides = selected.flatMap(p => p.slides);
        const combinedReference = selected.map(p => p.scriptureReference).join(', ');
        
        const blob = await scriptureService.exportSlides(
          allSlides,
          { format: exportFormat },
          `Combined: ${combinedReference}`
        );
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Combined_Scripture_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (exportType === 'archive') {
        // Create a ZIP archive with all files
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        
        for (const presentation of selected) {
          const blob = await scriptureService.exportSlides(
            presentation.slides,
            { format: exportFormat },
            presentation.scriptureReference
          );
          
          const arrayBuffer = await blob.arrayBuffer();
          zip.file(`${presentation.title.replace(/[^a-zA-Z0-9]/g, '_')}.${exportFormat}`, arrayBuffer);
        }
        
        // Add Castr content if available
        if (castrTitle && castrDescription) {
          zip.file('castr_content.txt', `TITLE:\n${castrTitle}\n\nDESCRIPTION:\n${castrDescription}`);
        }
        
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Scripture_Export_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      alert(`Successfully exported ${selected.length} presentation(s)!`);
    } catch (error) {
      console.error('Error exporting presentations:', error);
      alert('Error exporting presentations. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <header className="glass-card mx-4 mt-4 p-6 animate-slide-down">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Download className="w-8 h-8 text-primary-600" />
              <div>
                <h1 className="church-header">Batch Export</h1>
                <p className="text-accent-600 text-sm">Export Multiple Presentations</p>
              </div>
            </div>
            <AuthButton />
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8">
          <div className="glass-card p-12 text-center animate-slide-up">
            <Download className="w-16 h-16 mx-auto text-accent-400 mb-4" />
            <h2 className="text-2xl font-semibold text-accent-800 mb-2">Sign In Required</h2>
            <p className="text-accent-600 mb-6">Please sign in to access the export features.</p>
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
            <Download className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="church-header">Batch Export</h1>
              <p className="text-accent-600 text-sm">Export Multiple Presentations</p>
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
          
          {/* Export Settings Panel */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 animate-slide-up">
              <h2 className="text-xl font-semibold text-primary-800 mb-4 flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Export Settings</span>
              </h2>
              
              <div className="space-y-4">
                {/* Format Selection */}
                <div>
                  <label className="block text-sm font-medium text-accent-700 mb-2">
                    Export Format
                  </label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as 'rtf' | 'txt' | 'pro')}
                    className="glass-input w-full px-4 py-3"
                  >
                    <option value="rtf">RTF (Apple Pages)</option>
                    <option value="txt">TXT (Plain Text)</option>
                    <option value="pro">PRO (ProPresenter)</option>
                  </select>
                </div>

                {/* Export Type */}
                <div>
                  <label className="block text-sm font-medium text-accent-700 mb-2">
                    Export Type
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="individual"
                        checked={exportType === 'individual'}
                        onChange={(e) => setExportType(e.target.value as any)}
                        className="text-primary-600"
                      />
                      <span className="text-sm">Individual Files</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="combined"
                        checked={exportType === 'combined'}
                        onChange={(e) => setExportType(e.target.value as any)}
                        className="text-primary-600"
                      />
                      <span className="text-sm">Combined File</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="archive"
                        checked={exportType === 'archive'}
                        onChange={(e) => setExportType(e.target.value as any)}
                        className="text-primary-600"
                      />
                      <span className="text-sm">ZIP Archive</span>
                    </label>
                  </div>
                </div>

                {/* Export Button */}
                <button
                  onClick={exportSelected}
                  disabled={isExporting || getSelectedPresentations().length === 0}
                  className="glass-button w-full px-6 py-3 text-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent"></div>
                      <span>Exporting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Download className="w-4 h-4" />
                      <span>Export Selected ({getSelectedPresentations().length})</span>
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Castr Integration */}
            <div className="glass-card p-6 mt-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
              <h2 className="text-xl font-semibold text-primary-800 mb-4 flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Castr Integration</span>
              </h2>
              
              <div className="space-y-4">
                <button
                  onClick={generateCastrContent}
                  disabled={getSelectedPresentations().length === 0}
                  className="glass-button w-full px-4 py-3 text-secondary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate Castr Content
                </button>

                {castrTitle && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-accent-700 mb-2">
                        Stream Title
                      </label>
                      <textarea
                        value={castrTitle}
                        onChange={(e) => setCastrTitle(e.target.value)}
                        rows={2}
                        className="glass-input w-full px-4 py-3 text-sm"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(castrTitle)}
                        className="text-xs text-primary-600 hover:text-primary-800 mt-1"
                      >
                        Copy to Clipboard
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-accent-700 mb-2">
                        Stream Description
                      </label>
                      <textarea
                        value={castrDescription}
                        onChange={(e) => setCastrDescription(e.target.value)}
                        rows={6}
                        className="glass-input w-full px-4 py-3 text-sm"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(castrDescription)}
                        className="text-xs text-primary-600 hover:text-primary-800 mt-1"
                      >
                        Copy to Clipboard
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Presentations Selection Panel */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6 animate-slide-up" style={{animationDelay: '0.2s'}}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-primary-800">
                  Select Presentations
                </h2>
                
                <button
                  onClick={selectAll}
                  className="glass-button px-4 py-2 text-sm text-accent-700 hover:text-primary-700 transition-colors flex items-center space-x-2"
                >
                  {presentations.every(p => p.selected) ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  <span>
                    {presentations.every(p => p.selected) ? 'Deselect All' : 'Select All'}
                  </span>
                </button>
              </div>
              
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-accent-600">Loading presentations...</p>
                </div>
              ) : presentations.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto text-accent-400 mb-4" />
                  <h3 className="text-lg font-semibold text-accent-800 mb-2">No Presentations Found</h3>
                  <p className="text-accent-600">Create some presentations first to use the export feature.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {presentations.map((presentation) => (
                    <div
                      key={presentation.id}
                      className={`p-4 rounded-lg border transition-all cursor-pointer ${
                        presentation.selected
                          ? 'bg-primary-50/80 border-primary-300 shadow-soft'
                          : 'bg-accent-50/30 border-accent-200/50 hover:bg-primary-50/50'
                      }`}
                      onClick={() => toggleSelection(presentation.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {presentation.selected ? (
                            <CheckSquare className="w-5 h-5 text-primary-600" />
                          ) : (
                            <Square className="w-5 h-5 text-accent-400" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-accent-800 truncate">
                            {presentation.title}
                          </h4>
                          <p className="text-sm text-accent-600">
                            {presentation.scriptureReference}
                          </p>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-accent-500">
                            <span>{presentation.slides.length} slides</span>
                            <span>{new Date(presentation.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Export Summary */}
            {getSelectedPresentations().length > 0 && (
              <div className="glass-card p-6 mt-6 animate-slide-up" style={{animationDelay: '0.3s'}}>
                <h2 className="text-lg font-semibold text-primary-800 mb-4">Export Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary-600">
                      {getSelectedPresentations().length}
                    </div>
                    <div className="text-sm text-accent-600">Selected</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-secondary-600">
                      {getSelectedPresentations().reduce((sum, p) => sum + p.slides.length, 0)}
                    </div>
                    <div className="text-sm text-accent-600">Total Slides</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-accent-600">
                      {exportFormat.toUpperCase()}
                    </div>
                    <div className="text-sm text-accent-600">Format</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {exportType === 'individual' ? getSelectedPresentations().length : 1}
                    </div>
                    <div className="text-sm text-accent-600">
                      {exportType === 'archive' ? 'ZIP File' : 'Files'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}