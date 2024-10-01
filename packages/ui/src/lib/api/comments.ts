import type { SupabaseClient } from '@supabase/supabase-js';
import type { Views } from '../../types/database.types';

type CommentWithAuthor = Views<'comments_with_author'>;

export async function getComments(
  supabase: SupabaseClient,
  projectId: string,
  resolved: boolean
): Promise<CommentWithAuthor[]> {
  const { data, error } = await supabase
    .from('comments_with_author')
    .select('*')
    .eq('project_id', projectId)
    .eq('resolved', resolved)
    .returns<CommentWithAuthor[]>();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}
