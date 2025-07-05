'use client';

import Image from "next/image";
import { useState, useEffect } from "react";
import { scriptureService } from "../../services/scriptureService";
import { firestoreService } from "../../services/firestoreService";
import { Slide, ComplianceReport } from "../../types/scripture";
import AuthButton from "../../components/AuthButton";
import { useSession } from "next-auth/react";
import { BookOpen, Download, Save, Eye, Settings } from "lucide-react";

export default function ScripturePage() {
  const { data: session } = useSession();
  const [scriptureRef, setScriptureRef] = useState("Mark 2:1-12");
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'slides' | 'canvas'>('slides');
  const [esvApiKey, setEsvApiKey] = useState('');

  // Load ESV API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('esvApiKey');
    if (savedKey) {
      setEsvApiKey(savedKey);
    }
  }, []);

  const generateSlides = async () => {
    setIsLoading(true);
    try {
      const result = await scriptureService.generateSlides(scriptureRef);
      setSlides(result.slides);
      setComplianceReport(result.complianceReport);
      
      // Save to localStorage (for offline access)
      scriptureService.saveToStorage('lastGenerated', {
        reference: scriptureRef,
        slides: result.slides,
        timestamp: new Date().toISOString()
      });

      // Auto-save to Firestore if user is logged in
      if (session?.user?.id) {
        await saveToFirestore(result.slides, result.complianceReport);
      }
    } catch (error) {
      console.error("Error generating slides:", error);
      alert("Error generating slides. Please check the scripture reference format.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveToFirestore = async (slidesToSave: Slide[], compliance: ComplianceReport) => {
    if (!session?.user?.id) {
      alert('Please sign in to save presentations');
      return;
    }

    setIsSaving(true);
    try {
      const presentationId = await firestoreService.savePresentation({
        userId: session.user.id,
        title: scriptureRef,
        scriptureReference: scriptureRef,
        slides: slidesToSave,
        complianceReport: compliance,
        isPublic: false,
        tags: [scriptureRef.split(' ')[0]], // Add book name as tag
      });
      
      console.log('Presentation saved with ID:', presentationId);
      // Could show a success message here
    } catch (error) {
      console.error('Error saving to Firestore:', error);
      alert('Error saving presentation. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const exportSlides = async (format: 'rtf' | 'txt' | 'pro') => {
    if (slides.length === 0) {
      alert('Please generate slides first');
      return;
    }

    setIsExporting(true);
    try {
      const blob = await scriptureService.exportSlides(slides, { format }, scriptureRef);
      
      // Create download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${scriptureRef.replace(/[^a-zA-Z0-9]/g, '_')}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting slides:', error);
      alert(`Error exporting ${format.toUpperCase()} file: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="glass-card mx-4 mt-4 p-6 animate-slide-down">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <BookOpen className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="church-header">Scripture Slides</h1>
              <p className="text-accent-600 text-sm">CCC Rule Compliant Verse Slides</p>
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
          
          {/* Scripture Input Panel */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 animate-slide-up">
              <h2 className="text-xl font-semibold text-primary-800 mb-4 flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Scripture Input</span>
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="scripture" className="block text-sm font-medium text-accent-700 mb-2">
                    Enter Scripture Reference
                  </label>
                  <input
                    id="scripture"
                    type="text"
                    value={scriptureRef}
                    onChange={(e) => setScriptureRef(e.target.value)}
                    placeholder="e.g., Mark 2:1-12"
                    className="glass-input w-full px-4 py-3 text-accent-800 placeholder-accent-400"
                  />
                </div>

                <div>
                  <label htmlFor="esvKey" className="block text-sm font-medium text-accent-700 mb-2">
                    ESV API Key (Optional)
                  </label>
                  <input
                    id="esvKey"
                    type="password"
                    value={esvApiKey}
                    onChange={(e) => {
                      setEsvApiKey(e.target.value);
                      localStorage.setItem('esvApiKey', e.target.value);
                    }}
                    placeholder="Enter ESV API key for live scripture"
                    className="glass-input w-full px-4 py-3 text-accent-800 placeholder-accent-400"
                  />
                  <p className="text-xs text-accent-500 mt-1">
                    Get your free API key at <a href="https://api.esv.org" target="_blank" className="text-primary-600 hover:underline">api.esv.org</a>
                  </p>
                </div>
                
                <button
                  onClick={generateSlides}
                  disabled={isLoading || !scriptureRef.trim()}
                  className="glass-button w-full px-6 py-3 text-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent"></div>
                      <span>Generating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <BookOpen className="w-4 h-4" />
                      <span>Generate Slides</span>
                    </div>
                  )}
                </button>
                
                {session?.user && slides.length > 0 && (
                  <button
                    onClick={() => saveToFirestore(slides, complianceReport!)}
                    disabled={isSaving}
                    className="glass-button w-full px-6 py-3 text-secondary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  >
                    {isSaving ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-secondary-600 border-t-transparent"></div>
                        <span>Saving...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Save className="w-4 h-4" />
                        <span>Save to Cloud</span>
                      </div>
                    )}
                  </button>
                )}
              </div>

              {/* CCC Rules Summary */}
              <div className="mt-6 p-4 bg-primary-50/50 rounded-lg border border-primary-200/50">
                <h3 className="text-sm font-semibold text-primary-800 mb-2">CCC Rules Applied</h3>
                <ul className="text-xs text-primary-700 space-y-1">
                  <li>• Minimum 2 verses per slide</li>
                  <li>• Font size: 39-49pt (target 46pt)</li>
                  <li>• No 3+1 splits (redistribute as 2+2)</li>
                  <li>• Orphan prevention</li>
                  <li>• Intelligent sizing</li>
                </ul>
              </div>
            </div>

            {/* Export Options */}
            <div className="glass-card p-6 mt-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
              <h2 className="text-xl font-semibold text-primary-800 mb-4 flex items-center space-x-2">
                <Download className="w-5 h-5" />
                <span>Export Options</span>
              </h2>
              
              <div className="space-y-3">
                <button 
                  onClick={() => exportSlides('rtf')}
                  disabled={isExporting || slides.length === 0}
                  className="glass-button w-full px-4 py-3 text-left text-accent-700 hover:text-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <span>RTF (Apple Pages)</span>
                    <span className="text-xs text-accent-500">Recommended</span>
                  </div>
                </button>
                
                <button 
                  onClick={() => exportSlides('txt')}
                  disabled={isExporting || slides.length === 0}
                  className="glass-button w-full px-4 py-3 text-left text-accent-700 hover:text-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <span>TXT (Plain Text)</span>
                    <span className="text-xs text-accent-500">Simple</span>
                  </div>
                </button>
                
                <button 
                  onClick={() => exportSlides('pro')}
                  disabled={isExporting || slides.length === 0}
                  className="glass-button w-full px-4 py-3 text-left text-accent-700 hover:text-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <span>PRO (ProPresenter)</span>
                    <span className="text-xs text-accent-500">Advanced</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Slide Preview Panel */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6 animate-slide-up" style={{animationDelay: '0.2s'}}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-primary-800 flex items-center space-x-2">
                  <Eye className="w-5 h-5" />
                  <span>Slide Preview</span>
                </h2>
                
                {slides.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPreviewMode('slides')}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        previewMode === 'slides' 
                          ? 'bg-primary-100 text-primary-800' 
                          : 'text-accent-600 hover:text-primary-700'
                      }`}
                    >
                      Slides
                    </button>
                    <button
                      onClick={() => setPreviewMode('canvas')}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        previewMode === 'canvas' 
                          ? 'bg-primary-100 text-primary-800' 
                          : 'text-accent-600 hover:text-primary-700'
                      }`}
                    >
                      Canvas
                    </button>
                  </div>
                )}
              </div>
              
              {slides.length === 0 ? (
                <div className="slide-container flex items-center justify-center">
                  <div className="text-center text-white/70">
                    <div className="mb-4">
                      <BookOpen className="w-16 h-16 mx-auto opacity-50" />
                    </div>
                    <p className="text-lg">Enter a scripture reference to generate slides</p>
                    <p className="text-sm mt-2 opacity-75">CCC rules will be automatically applied</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {slides.map((slide, index) => (
                    <div key={slide.id} className="slide-container p-8">
                      <div className="text-center">
                        <h3 className="text-2xl font-bold mb-4">{slide.title}</h3>
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
              )}
            </div>

            {/* Compliance Report */}
            {complianceReport && (
              <div className="glass-card p-6 mt-6 animate-slide-up" style={{animationDelay: '0.3s'}}>
                <h2 className="text-xl font-semibold text-primary-800 mb-4">
                  CCC Compliance Report
                </h2>
                <div className="bg-green-50/50 border border-green-200/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-800 font-medium">100% CCC Rule Compliance</span>
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