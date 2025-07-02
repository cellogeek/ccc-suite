'use client';

import { useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function SupabaseAuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    // Get initial user
    supabaseService.getCurrentUser().then(setUser).finally(() => setIsLoading(false));

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignInWithGoogle = async () => {
    setIsSigningIn(true);
    try {
      await supabaseService.signInWithGoogle();
    } catch (error) {
      console.error('Sign in error:', error);
      alert('Error signing in with Google');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningIn(true);
    try {
      await supabaseService.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      alert('Error signing out');
    } finally {
      setIsSigningIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-button px-4 py-2 animate-pulse">
        <div className="h-4 bg-white/20 rounded w-16"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center space-x-4">
        <div className="text-sm text-accent-700">
          Welcome, {user.user_metadata?.full_name || user.email}
        </div>
        <button
          onClick={handleSignOut}
          disabled={isSigningIn}
          className="glass-button px-4 py-2 text-sm text-accent-700 hover:text-primary-700 transition-colors disabled:opacity-50"
        >
          {isSigningIn ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleSignInWithGoogle}
        disabled={isSigningIn}
        className="glass-button px-4 py-2 text-sm text-accent-700 hover:text-primary-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span>{isSigningIn ? 'Signing in...' : 'Sign in with Google'}</span>
      </button>
    </div>
  );
}