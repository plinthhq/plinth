import { useCallback } from 'react';
import useSWR from 'swr';
import { useSupabase } from '../../providers/supabase-provider';
import type { CommentWithAuthor } from '../../types/database.types';

export function useThread(parentCommentId: string): {
  data: CommentWithAuthor[] | undefined;
  error: Error | undefined;
  isLoading: boolean;
} {
  const { supabase } = useSupabase();

  // Memoize the fetcher function
  const fetcher = useCallback(async (): Promise<CommentWithAuthor[]> => {
    const { data, error: errorOnCommentsFetch } = await supabase
      .from('comments_with_author')
      .select('*')
      .eq('parent_id', parentCommentId)
      .returns<CommentWithAuthor[]>();

    if (errorOnCommentsFetch) {
      throw new Error(errorOnCommentsFetch.message);
    }
    return data;
  }, [supabase, parentCommentId]);

  const { data, error, isLoading } = useSWR<CommentWithAuthor[], Error>(
    ['thread', parentCommentId], //Cache dependencies
    () => fetcher() //Pass the fetcher with arguments (we don't need to pass anything)
  );

  return {
    data,
    error,
    isLoading,
  };
}
