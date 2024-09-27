'use client';

import { SupabaseProvider, useSupabase } from './providers/supabase-provider';
import { Toolbar } from './toolbar';
import { Welcome } from './welcome';

const Content = (): JSX.Element => {
  const { session } = useSupabase();

  return <>{session ? <Toolbar /> : <Welcome />}</>;
};

interface PlinthProps {
  backendUrl: string;
  anonKey: string;
}

const Plinth = ({ backendUrl, anonKey }: PlinthProps): JSX.Element => {
  return (
    <SupabaseProvider supabaseUrl={backendUrl} supabaseAnonKey={anonKey}>
      <Content />
    </SupabaseProvider>
  );
};

export { Plinth };
