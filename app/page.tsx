'use client';

import Image from "next/image";
import { useState, useEffect } from "react";
import { scriptureService } from "../services/scriptureService";
import { supabaseService } from "../services/supabaseService";
import { Slide, ComplianceReport } from "../types/scripture";
import AuthButton from "../components/AuthButton";
import { useSession } from "next-auth/react";
import { Key } from "lucide-react";

export default function Home() {
  const { data: session } = useSession();
  const [scriptureRef, setScriptureRef] = useState("Mark 2:1-12");
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasEsvKey, setHasEsvKey] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      checkEsvApiKey();
    }
  }, [session]);

  const checkEsvApiKey = async () => {
    if (!session?.user?.id) return;
    
    try {
      const esvKey = await supabaseService.getEsvApiKey(session.user.id);
      setHasEsvKey(!!esvKey);
    } catch (error) {
      console.error('Error checking ESV API key:', error);
    }
  };

  const generateSlides = async () => {
    setIsLoading(true);
    try {
      const result = await scriptureService.generateSlides(scriptureRef, {
        userId: session?.user?.id // Pass userId to enable ESV API
      });
      setSlides(result.slides);
      setComplianceReport(result.complianceReport);
      
      // Save to localStorage (for offline access)
      scriptureService.saveToStorage('lastGenerated', {
        reference: scriptureRef,
        slides: result.slides,
        timestamp: new Date().toISOString()
      });

      // Auto-save to Supabase if user is logged in
      if (session?.user?.id) {
        await saveToSupabase(result.slides, result.complianceReport);
      }
    } catch (error) {
      console.error("Error generating slides:", error);
      alert("Error generating slides. Please check the scripture reference format.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveToSupabase = async (slidesToSave: Slide[], compliance: ComplianceReport) => {
    if (!session?.user?.id) {
      alert('Please sign in to save presentations');
      return;
    }

    setIsSaving(true);
    try {
      const presentationId = await supabaseService.savePresentation({
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
      console.error('Error saving to Supabase:', error);
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
      alert(`Error exporting ${format.toUpperCase()} file: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
            <Image
              src="/1.jpg"
              alt="Canyon Country Freewill Baptist Church Logo"
              width={60}
              height={60}
              className="rounded-full shadow-soft"
            />
            <div>
              <h1 className="church-header">CCC Suite</h1>
              <p className="text-accent-600 text-sm">Canyon Country Freewill Baptist Church</p>
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
              <h2 className="text-xl font-semibold text-primary-800 mb-4">
                Scripture Reference
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
                    "Generate Slides"
                  )}
                </button>
                
                {session?.user && slides.length > 0 && (
                  <button
                    onClick={() => saveToSupabase(slides, complianceReport!)}
                    disabled={isSaving}
                    className="glass-button w-full px-6 py-3 text-secondary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  >
                    {isSaving ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-secondary-600 border-t-transparent"></div>
                        <span>Saving...</span>
                      </div>
                    ) : (
                      "Save to Cloud"
                    )}
                  </button>
                )}
              </div>

              {/* ESV API Status */}
              {session?.user && (
                <div className="mt-6 p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
                  <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center space-x-2">
                    <Key className="w-4 h-4" />
                    <span>Scripture Text</span>
                  </h3>
                  {hasEsvKey ? (
                    <p className="text-sm text-green-700">✅ Using real ESV scripture text</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-blue-700">⚠️ Using placeholder text</p>
                      <a
                        href="/settings"
                        className="inline-block text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Add ESV API key for real scripture →
                      </a>
                    </div>
                  )}
                </div>
              )}

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
              <h2 className="text-xl font-semibold text-primary-800 mb-4">
                Export Options
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
                    <span className="text-xs text-accent-500
