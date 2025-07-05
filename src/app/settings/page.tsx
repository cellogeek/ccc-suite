'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Settings, Key, User, Database, Palette, Save, Eye, EyeOff } from "lucide-react";
import AuthButton from "../../components/AuthButton";
import { supabaseService } from "../../services/supabaseService";

interface UserSettings {
  esvApiKey: string;
  defaultFontSize: number;
  defaultExportFormat: 'rtf' | 'txt' | 'pro';
  autoSave: boolean;
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<UserSettings>({
    esvApiKey: '',
    defaultFontSize: 46,
    defaultExportFormat: 'rtf',
    autoSave: true,
    theme: 'light',
    notifications: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingApiKey, setTestingApiKey] = useState(false);
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);

  useEffect(() => {
    loadSettings();
  }, [session]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // Load from localStorage first
      const localSettings = {
        esvApiKey: localStorage.getItem('esvApiKey') || '',
        defaultFontSize: parseInt(localStorage.getItem('defaultFontSize') || '46'),
        defaultExportFormat: (localStorage.getItem('defaultExportFormat') || 'rtf') as 'rtf' | 'txt' | 'pro',
        autoSave: localStorage.getItem('autoSave') !== 'false',
        theme: (localStorage.getItem('theme') || 'light') as 'light' | 'dark' | 'auto',
        notifications: localStorage.getItem('notifications') !== 'false'
      };

      setSettings(localSettings);

      // If user is logged in, try to load from database
      if (session?.user?.id) {
        try {
          const dbSettings = await supabaseService.getUserSettings(session.user.id);
          if (dbSettings) {
            setSettings({ ...localSettings, ...dbSettings });
          }
        } catch (error) {
          console.error('Error loading settings from database:', error);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('esvApiKey', settings.esvApiKey);
      localStorage.setItem('defaultFontSize', settings.defaultFontSize.toString());
      localStorage.setItem('defaultExportFormat', settings.defaultExportFormat);
      localStorage.setItem('autoSave', settings.autoSave.toString());
      localStorage.setItem('theme', settings.theme);
      localStorage.setItem('notifications', settings.notifications.toString());

      // Save to database if user is logged in
      if (session?.user?.id) {
        await supabaseService.saveUserSettings(session.user.id, settings);
      }

      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const testApiKey = async () => {
    if (!settings.esvApiKey.trim()) {
      alert('Please enter an API key first.');
      return;
    }

    setTestingApiKey(true);
    try {
      const response = await fetch('https://api.esv.org/v3/passage/text/?q=John+3:16', {
        headers: {
          'Authorization': `Token ${settings.esvApiKey}`
        }
      });

      if (response.ok) {
        setApiKeyValid(true);
        alert('API key is valid! ✓');
      } else {
        setApiKeyValid(false);
        alert('API key is invalid or expired. Please check your key.');
      }
    } catch (error) {
      console.error('Error testing API key:', error);
      setApiKeyValid(false);
      alert('Error testing API key. Please check your internet connection.');
    } finally {
      setTestingApiKey(false);
    }
  };

  const resetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      const defaultSettings: UserSettings = {
        esvApiKey: '',
        defaultFontSize: 46,
        defaultExportFormat: 'rtf',
        autoSave: true,
        theme: 'light',
        notifications: true
      };
      setSettings(defaultSettings);
      setApiKeyValid(null);
    }
  };

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (key === 'esvApiKey') {
      setApiKeyValid(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="glass-card mx-4 mt-4 p-6 animate-slide-down">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Settings className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="church-header">Settings</h1>
              <p className="text-accent-600 text-sm">Manage Your CCC Suite Preferences</p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <AuthButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="glass-card p-12 text-center animate-slide-up">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-accent-600">Loading settings...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* API Configuration */}
            <div className="glass-card p-6 animate-slide-up">
              <h2 className="text-xl font-semibold text-primary-800 mb-4 flex items-center space-x-2">
                <Key className="w-5 h-5" />
                <span>API Configuration</span>
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="esvApiKey" className="block text-sm font-medium text-accent-700 mb-2">
                    ESV API Key
                  </label>
                  <div className="relative">
                    <input
                      id="esvApiKey"
                      type={showApiKey ? "text" : "password"}
                      value={settings.esvApiKey}
                      onChange={(e) => updateSetting('esvApiKey', e.target.value)}
                      placeholder="Enter your ESV API key"
                      className="glass-input w-full px-4 py-3 pr-20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-12 top-1/2 transform -translate-y-1/2 text-accent-500 hover:text-accent-700"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {apiKeyValid !== null && (
                      <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full ${
                        apiKeyValid ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-accent-500">
                      Get your free API key at{' '}
                      <a href="https://api.esv.org" target="_blank" className="text-primary-600 hover:underline">
                        api.esv.org
                      </a>
                    </p>
                    <button
                      onClick={testApiKey}
                      disabled={testingApiKey || !settings.esvApiKey.trim()}
                      className="text-xs text-primary-600 hover:text-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {testingApiKey ? 'Testing...' : 'Test Key'}
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">About ESV API</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Free tier: 5,000 requests per day</li>
                    <li>• Provides accurate scripture text</li>
                    <li>• Enhances CCC rule compliance</li>
                    <li>• Optional - works without API key</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Presentation Defaults */}
            <div className="glass-card p-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
              <h2 className="text-xl font-semibold text-primary-800 mb-4 flex items-center space-x-2">
                <Palette className="w-5 h-5" />
                <span>Presentation Defaults</span>
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="defaultFontSize" className="block text-sm font-medium text-accent-700 mb-2">
                    Default Font Size (39-49pt)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      id="defaultFontSize"
                      type="range"
                      min="39"
                      max="49"
                      value={settings.defaultFontSize}
                      onChange={(e) => updateSetting('defaultFontSize', parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-accent-800 w-12">
                      {settings.defaultFontSize}pt
                    </span>
                  </div>
                  <p className="text-xs text-accent-500 mt-1">
                    CCC recommended: 46pt (optimal readability)
                  </p>
                </div>

                <div>
                  <label htmlFor="defaultExportFormat" className="block text-sm font-medium text-accent-700 mb-2">
                    Default Export Format
                  </label>
                  <select
                    id="defaultExportFormat"
                    value={settings.defaultExportFormat}
                    onChange={(e) => updateSetting('defaultExportFormat', e.target.value as 'rtf' | 'txt' | 'pro')}
                    className="glass-input w-full px-4 py-3"
                  >
                    <option value="rtf">RTF (Apple Pages) - Recommended</option>
                    <option value="txt">TXT (Plain Text)</option>
                    <option value="pro">PRO (ProPresenter)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="autoSave" className="text-sm font-medium text-accent-700">
                      Auto-save presentations
                    </label>
                    <p className="text-xs text-accent-500">
                      Automatically save when signed in
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      id="autoSave"
                      type="checkbox"
                      checked={settings.autoSave}
                      onChange={(e) => updateSetting('autoSave', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-accent-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-accent-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* User Preferences */}
            <div className="glass-card p-6 animate-slide-up" style={{animationDelay: '0.2s'}}>
              <h2 className="text-xl font-semibold text-primary-800 mb-4 flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>User Preferences</span>
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="theme" className="block text-sm font-medium text-accent-700 mb-2">
                    Theme
                  </label>
                  <select
                    id="theme"
                    value={settings.theme}
                    onChange={(e) => updateSetting('theme', e.target.value as 'light' | 'dark' | 'auto')}
                    className="glass-input w-full px-4 py-3"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="notifications" className="text-sm font-medium text-accent-700">
                      Enable notifications
                    </label>
                    <p className="text-xs text-accent-500">
                      Get notified about updates and features
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      id="notifications"
                      type="checkbox"
                      checked={settings.notifications}
                      onChange={(e) => updateSetting('notifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-accent-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-accent-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="glass-card p-6 animate-slide-up" style={{animationDelay: '0.3s'}}>
              <h2 className="text-xl font-semibold text-primary-800 mb-4 flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Account Information</span>
              </h2>
              
              {session ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-accent-700 mb-1">
                      Email
                    </label>
                    <p className="text-accent-800">{session.user?.email}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-accent-700 mb-1">
                      Name
                    </label>
                    <p className="text-accent-800">{session.user?.name || 'Not provided'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-accent-700 mb-1">
                      Account Type
                    </label>
                    <p className="text-accent-800">Free Account</p>
                  </div>

                  <div className="p-4 bg-green-50/50 rounded-lg border border-green-200/50">
                    <h4 className="text-sm font-semibold text-green-800 mb-2">✓ Account Benefits</h4>
                    <ul className="text-xs text-green-700 space-y-1">
                      <li>• Cloud storage for presentations</li>
                      <li>• Cross-device synchronization</li>
                      <li>• Automatic backups</li>
                      <li>• Settings persistence</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="w-12 h-12 mx-auto text-accent-400 mb-4" />
                  <p className="text-accent-600 mb-4">Sign in to access account features</p>
                  <AuthButton />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="glass-button px-8 py-3 text-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent"></div>
                <span>Saving...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Save className="w-4 h-4" />
                <span>Save Settings</span>
              </div>
            )}
          </button>
          
          <button
            onClick={resetSettings}
            className="glass-button px-8 py-3 text-accent-700 font-medium hover:text-red-600 transition-colors"
          >
            Reset to Defaults
          </button>
        </div>

        {/* CCC Suite Info */}
        <div className="glass-card p-6 mt-8 text-center animate-slide-up" style={{animationDelay: '0.4s'}}>
          <h3 className="text-lg font-semibold text-primary-800 mb-2">CCC Suite v1.0</h3>
          <p className="text-accent-600 text-sm mb-4">
            Built for Canyon Country Freewill Baptist Church Media Team
          </p>
          <div className="flex justify-center space-x-6 text-xs text-accent-500">
            <span>100% CCC Rule Compliant</span>
            <span>•</span>
            <span>Multi-format Export</span>
            <span>•</span>
            <span>Cloud Sync</span>
          </div>
        </div>
      </main>
    </div>
  );
}