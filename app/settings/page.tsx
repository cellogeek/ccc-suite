'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Settings, Key, Save, Eye, EyeOff, ExternalLink, CheckCircle, Users } from "lucide-react";
import AuthButton from "../../components/AuthButton";
import { supabaseService } from "../../services/supabaseService";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [organizationEsvApiKey, setOrganizationEsvApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestResult, setKeyTestResult] = useState<'success' | 'error' | null>(null);

  // Personal settings
  const [defaultFontSize, setDefaultFontSize] = useState(46);
  const [defaultMaxVerses, setDefaultMaxVerses] = useState(4);
  const [defaultExportFormat, setDefaultExportFormat] = useState<'rtf' | 'txt' | 'pro'>('rtf');
  const [autoSave, setAutoSave] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      loadSettings();
    } else {
      setIsLoading(false);
    }
  }, [session]);

  const loadSettings = async () => {
    if (!session?.user?.id) return;

    try {
      // Load organization ESV API key
      const orgEsvKey = await supabaseService.getOrganizationEsvApiKey();
      setOrganizationEsvApiKey(orgEsvKey || '');

      // Load user's personal settings
      const userSettings = await supabaseService.getUserSettings(session.user.id);
      if (userSettings) {
        setDefaultFontSize(userSettings.defaultFontSize || 46);
        setDefaultMaxVerses(userSettings.defaultMaxVerses || 4);
        setDefaultExportFormat(userSettings.defaultExportFormat || 'rtf');
        setAutoSave(userSettings.autoSave !== false);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setSaveMessage('❌ Error loading settings');
    } finally {
      setIsLoading(false);
    }
  };

  const testEsvApiKey = async () => {
    if (!organizationEsvApiKey.trim()) {
      alert('Please enter an ESV API key first');
      return;
    }

    setIsTestingKey(true);
    setKeyTestResult(null);

    try {
      // Test the API key with a simple verse request
      const response = await fetch(`https://api.esv.org/v3/passage/text/?q=John+3:16&include-headings=false&include-footnotes=false&include-verse-numbers=false&include-short-copyright=false&include-passage-references=false`, {
        headers: {
          'Authorization': `Token ${organizationEsvApiKey.trim()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.passages && data.passages.length > 0) {
          setKeyTestResult('success');
          setSaveMessage('✅ ESV API key is valid!');
        } else {
          setKeyTestResult('error');
          setSaveMessage('❌ Invalid response from ESV API');
        }
      } else {
        setKeyTestResult('error');
        setSaveMessage('❌ Invalid ESV API key');
      }
    } catch (error) {
      console.error('Error testing ESV API key:', error);
      setKeyTestResult('error');
      setSaveMessage('❌ Error testing ESV API key');
    } finally {
      setIsTestingKey(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const saveOrganizationEsvKey = async () => {
    if (!session?.user?.id) {
      alert('Please sign in to save settings');
      return;
    }

    setIsSaving(true);
    setSaveMessage('');

    try {
      await supabaseService.saveOrganizationEsvApiKey(organizationEsvApiKey.trim(), session.user.id);
      setSaveMessage('✅ Organization ESV API key saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving organization ESV API key:', error);
      setSaveMessage('❌ Error saving ESV API key. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const savePersonalSettings = async () => {
    if (!session?.user?.id) {
      alert('Please sign in to save settings');
      return;
    }

    setIsSaving(true);
    setSaveMessage('');

    try {
      await supabaseService.saveUserSettings(session.user.id, {
        defaultFontSize,
        defaultMaxVerses,
        defaultExportFormat,
        autoSave
      });

      setSaveMessage('✅ Personal settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving personal settings:', error);
      setSaveMessage('❌ Error saving personal settings. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <header className="glass-card mx-4 mt-4 p-6 animate-slide-down">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Settings className="w-8 h-8 text-primary-600" />
              <div>
                <h1 className="church-header">Settings</h1>
                <p className="text-accent-600 text-sm">Configure Your Preferences</p>
              </div>
            </div>
            <AuthButton />
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="glass-card p-12 text-center animate-slide-up">
            <Settings className="w-16 h-16 mx-auto text-accent-400 mb-4" />
            <h2 className="text-2xl font-semibold text-accent-800 mb-2">Sign In Required</h2>
            <p className="text-accent-600 mb-6">Please sign in to access your settings.</p>
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
            <Settings className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="church-header">Settings</h1>
              <p className="text-accent-600 text-sm">Configure Your Preferences</p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <AuthButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Organization ESV API Key Section */}
          <div className="glass-card p-6 animate-slide-up">
            <h2 className="text-xl font-semibold text-primary-800 mb-4 flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Organization ESV API Configuration</span>
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50/50 border border-blue-200/50 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">Shared ESV API Key</h3>
                <p className="text-sm text-blue-700 mb-3">
                  This ESV API key will be used by everyone in your organization. Get a free key from Crossway to display actual scripture text instead of placeholders.
                </p>
                <a
                  href="https://api.esv.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  <span>Get Free ESV API Key</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div>
                <label className="block text-sm font-medium text-accent-700 mb-2">
                  Organization ESV API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={organizationEsvApiKey}
                    onChange={(e) => setOrganizationEsvApiKey(e.target.value)}
                    placeholder="Enter your organization's ESV API key here..."
                    className="glass-input w-full px-4 py-3 pr-12 text-accent-800 placeholder-accent-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-accent-400 hover:text-accent-600"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={testEsvApiKey}
                  disabled={isTestingKey || !organizationEsvApiKey.trim()}
                  className="glass-button px-4 py-2 text-secondary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTestingKey ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-secondary-600 border-t-transparent"></div>
                      <span>Testing...</span>
                    </div>
                  ) : (
                    'Test API Key'
                  )}
                </button>

                <button
                  onClick={saveOrganizationEsvKey}
                  disabled={isSaving || !organizationEsvApiKey.trim()}
                  className="glass-button px-4 py-2 text-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Save className="w-4 h-4" />
                      <span>Save ESV Key</span>
                    </div>
                  )}
                </button>

                {keyTestResult === 'success' && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Valid</span>
                  </div>
                )}
              </div>

              {saveMessage && (
                <div className="p-3 bg-accent-50 border border-accent-200 rounded-lg">
                  <p className="text-sm text-accent-700">{saveMessage}</p>
                </div>
              )}
            </div>
          </div>

          {/* Personal Settings Section */}
          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-xl font-semibold text-primary-800 mb-4 flex items-center space-x-2">
              <Key className="w-5 h-5" />
              <span>Personal Preferences</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-accent-700 mb-2">
                  Default Font Size (39-49pt)
                </label>
                <input
                  type="range"
                  min="39"
                  max="49"
                  value={defaultFontSize}
                  onChange={(e) => setDefaultFontSize(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-center text-sm text-accent-600 mt-1">
                  {defaultFontSize}pt
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-accent-700 mb-2">
                  Default Max Verses Per Slide
                </label>
                <select
                  value={defaultMaxVerses}
                  onChange={(e) => setDefaultMaxVerses(Number(e.target.value))}
                  className="glass-input w-full px-4 py-3"
                >
                  <option value={2}>2 verses</option>
                  <option value={3}>3 verses</option>
                  <option value={4}>4 verses</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-accent-700 mb-2">
                  Default Export Format
                </label>
                <select
                  value={defaultExportFormat}
                  onChange={(e) => setDefaultExportFormat(e.target.value as 'rtf' | 'txt' | 'pro')}
                  className="glass-input w-full px-4 py-3"
                >
                  <option value="rtf">RTF (Apple Pages)</option>
                  <option value="txt">TXT (Plain Text)</option>
                  <option value="pro">PRO (ProPresenter)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-accent-700 mb-2">
                  Auto-Save Presentations
                </label>
                <div className="flex items-center space-x-3 mt-3">
                  <input
                    type="checkbox"
                    id="autoSave"
                    checked={autoSave}
                    onChange={(e) => setAutoSave(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <label htmlFor="autoSave" className="text-sm text-accent-700">
                    Automatically save presentations to cloud when signed in
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={savePersonalSettings}
                disabled={isSaving}
                className="glass-button px-6 py-3 text-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Save className="w-4 h-4" />
                    <span>Save Personal Settings</span>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-xl font-semibold text-primary-800 mb-4">
              How Organization ESV API Works
            </h2>
            <div className="space-y-3 text-sm text-accent-700">
              <p>1. <strong>One API key for everyone</strong> - The organization ESV API key is shared across all users</p>
              <p>2. <strong>Get your free API key</strong> from <a href="https://api.esv.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">api.esv.org</a></p>
              <p>3. <strong>Test and save</strong> the key above - it will be used by everyone in your organization</p>
              <p>4. <strong>Generate scripture slides</strong> - everyone will now see actual ESV text instead of placeholders</p>
              <p>5. <strong>Personal preferences</strong> - Each user can still customize their own font size, export format, etc.</p>
            </div>
          </div>

          {/* Authentication Debug Info */}
          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <h2 className="text-xl font-semibold text-primary-800 mb-4">
              Authentication Debug Info
            </h2>
            <div className="space-y-2 text-sm text-accent-700 bg-gray-50 p-4 rounded-lg">
              <p><strong>User ID:</strong> {session?.user?.id || 'Not available'}</p>
              <p><strong>Email:</strong> {session?.user?.email || 'Not available'}</p>
              <p><strong>Name:</strong> {session?.user?.name || 'Not available'}</p>
              <p><strong>Session Status:</strong> {session ? 'Active' : 'No session'}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}