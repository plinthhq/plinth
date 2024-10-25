import type { SupabaseClient } from '@supabase/supabase-js';
import { type Arguments, mutate } from 'swr';
import type { CommentWithAuthor } from '../../types/database.types';

// Marks a comment as unresolved/resolved then invalidates the cache and fetches the updated data
// cacheKey: this is the SWR key that you used when you fetched the data originally
// e.g. ['comments', comment.project_id, resolved]
//TODO: Potentially remove the cacheKey argument and the function will work out which caches to
// invalidate?
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
        c.id === comment.id || c.parent_id === comment.id
          ? { ...c, resolved }
          : c
      );
    },
    { revalidate: false }
  );

  // Perform the actual update
  const { error } = await supabase
    .from('comments')
    .update({ resolved })
    .or(`id.eq.${comment.id},parent_id.eq.${comment.id}`);

  if (error) {
    console.error(error);
  }

  // Rollback if the update fails or revalidate to ensure the local and remote states are synced
  // void mutate(['comments', comment.project_id]);
  void mutate(cacheKey);
}
