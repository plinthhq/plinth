'use client';

import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
} from 'react';
import { createClient, Session, SupabaseClient } from '@supabase/supabase-js';

// Define the context with Supabase client and session
interface SupabaseContextType {
  supabase: SupabaseClient;
  session: Session | null;
}

const SupabaseContext = createContext<SupabaseContextType | null>(null);

interface SupabaseProviderProps {
  supabaseUrl: string;
  supabaseAnonKey: string;
  children: ReactNode;
}

// We don't want to create multiple clients
// This is provider is run a tonne of times and this will happen without a singleton
let supabaseSingleton: SupabaseClient | null = null;

const getSupabaseClient = (supabaseUrl: string, supabaseAnonKey: string) => {
  if (!supabaseSingleton) {
    supabaseSingleton = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseSingleton;
};

export const SupabaseProvider = ({
  supabaseUrl,
  supabaseAnonKey,
  children,
}: SupabaseProviderProps) => {
  // Store the session and the client here
  const [session, setSession] = useState<Session | null>(null);
  const supabase = getSupabaseClient(supabaseUrl, supabaseAnonKey);

  useEffect(() => {
    // Check for an initial session
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        //TODO: Better error handling?
        console.error('Error getting session:', error);
      } else {
        setSession(data.session); // Update session state
      }
    };

    // We handle the error above so can void this
    void getSession();

    // Listen for changes to the auth state
    //https://supabase.com/docs/reference/javascript/auth-onauthstatechange
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, latestSession) => {
        setSession(latestSession);
      }
    );

    // Cleanup the listener when component unmounts
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <SupabaseContext.Provider value={{ supabase, session }}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};
