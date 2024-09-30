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
  projectId: string;
}

const Plinth = ({
  backendUrl,
  anonKey,
  projectId,
}: PlinthProps): JSX.Element => {
  return (
    <SupabaseProvider
      projectId={projectId}
      supabaseAnonKey={anonKey}
      supabaseUrl={backendUrl}
    >
      <Content />
    </SupabaseProvider>
  );
};

export { Plinth };
