import { useCallback } from 'react';
import useSWR from 'swr';
import type { CommentWithAuthor } from '../../types/database.types';
import { useSupabase } from '../../providers/supabase-provider';

export function usePageComments(pageUrl: string): {
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
      .is('parent_id', null)
      .eq('project_id', projectId)
      .eq('page_url', pageUrl)
      .eq('resolved', false)
      .returns<CommentWithAuthor[]>();

    if (errorOnCommentsFetch) {
      throw new Error(errorOnCommentsFetch.message);
    }
    return data;
  }, [supabase, projectId, pageUrl]);

  const { data, error, isLoading } = useSWR<CommentWithAuthor[], Error>(
    ['comments', projectId], //Cache dependencies
    () => fetcher() //Pass the fetcher with arguments (we don't need to pass anything)
  );

  return {
    data,
    error,
    isLoading,
  };
}
