'use client';
import { Button } from './button';
import { useSupabase } from './providers/supabase-provider';

const Welcome = (): JSX.Element => {
  const { supabase } = useSupabase();

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: 'tom.titherington@gmail.com',
      password: 'Developer123!',
    });

    if (error) {
      console.error('Error signing in:', error.message);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 flex w-96 flex-col gap-4 rounded-md border bg-background p-4 shadow-lg">
      <h1>Please sign in to continue</h1>
      <Button
        className="mt-auto w-full"
        onClick={() => {
          void handleSignIn();
        }}
      >
        Sign In
      </Button>
    </div>
  );
};

export { Welcome };
