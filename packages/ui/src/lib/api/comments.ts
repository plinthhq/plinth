import type { SupabaseClient } from '@supabase/supabase-js';
import type { CommentWithAuthor } from '../../types/database.types';

//QUESTION: Can we just use the supabase singleton here instead of passing it via an argument?
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
