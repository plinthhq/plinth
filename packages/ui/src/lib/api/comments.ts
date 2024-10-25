import type { SupabaseClient } from '@supabase/supabase-js';
import { type Arguments, mutate } from 'swr';
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

export async function getCommentsForPage(
  supabase: SupabaseClient,
  projectId: string,
  pageUrl: string
): Promise<CommentWithAuthor[]> {
  const { data, error } = await supabase
    .from('comments_with_author')
    .select('*')
    .is('parent_id', null)
    .eq('project_id', projectId)
    .eq('page_url', pageUrl)
    .eq('resolved', false)
    .returns<CommentWithAuthor[]>();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function getCommentsInThread(
  supabase: SupabaseClient,
  parentCommentId: string
): Promise<CommentWithAuthor[]> {
  const { data, error } = await supabase
    .from('comments_with_author')
    .select('*')
    .eq('parent_id', parentCommentId)
    .returns<CommentWithAuthor[]>();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

// Marks a comment as unresolved/resolved then invalidates the cache and fetches the updated data
// cacheKey: this is the SWR key that you used when you fetched the data originally
// e.g. ['comments', comment.project_id, resolved]
export async function markAs(
  supabase: SupabaseClient,
  comment: CommentWithAuthor,
  resolved: boolean,
  cacheKey: Arguments
): Promise<void> {
  // Optimistically update the comment as resolved/unresolved and don't revalidate (call remote) yet
  void mutate(
    // ['comments', comment.project_id, resolved],
    cacheKey,
    (existingComments: CommentWithAuthor[] | undefined) => {
      if (!existingComments) {
        return [];
      }
      return existingComments.map((c) =>
        c.id === comment.id ? { ...c, resolved } : c
      );
    },
    { revalidate: false }
  );

  // Perform the actual update
  const { error } = await supabase
    .from('comments')
    .update({ resolved })
    .eq('id', comment.id);

  if (error) {
    console.error(error);
  }

  // Rollback if the update fails or revalidate to ensure the local and remote states are synced
  // void mutate(['comments', comment.project_id]);
  void mutate(cacheKey);
}
