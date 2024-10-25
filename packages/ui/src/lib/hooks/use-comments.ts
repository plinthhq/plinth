import { useCallback } from 'react';
import useSWR from 'swr';
import { useSupabase } from '../../providers/supabase-provider';
import type { CommentWithAuthor } from '../../types/database.types';

export function useComments(resolved: boolean): {
  data: CommentWithAuthor[] | undefined;
  error: Error | undefined;
  isLoading: boolean;
} {
  const { supabase, projectId } = useSupabase();

  // Memoize the fetcher function
  const fetcher = useCallback(async (): Promise<CommentWithAuthor[]> => {
    const { data, error: errorOnCommentsFetch } = await supabase
      .from('comments_with_author')
      .select('*')
      .eq('project_id', projectId)
      .eq('resolved', resolved)
      .returns<CommentWithAuthor[]>();

    if (errorOnCommentsFetch) {
      throw new Error(errorOnCommentsFetch.message);
    }
    return data;
  }, [supabase, projectId, resolved]);

  const { data, error, isLoading } = useSWR<CommentWithAuthor[], Error>(
    ['comments', projectId, resolved], //Cache dependencies
    () => fetcher() //Pass the fetcher with arguments (we don't need to pass anything)
  );

  return {
    data,
    error,
    isLoading,
  };
}
