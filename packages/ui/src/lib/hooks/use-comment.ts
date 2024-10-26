import { mutate } from 'swr';
import { CommentWithAuthor } from '../../types/database.types';
import { useSupabase } from '../../providers/supabase-provider';
import { useCallback } from 'react';

export function useComment(): {
  markAs: (comment: CommentWithAuthor, resolved: boolean) => Promise<void>;
  deleteComment: (comment: CommentWithAuthor) => Promise<void>;
} {
  const { supabase } = useSupabase();

  //TODO: Update comment function
  // pass the original comment and then new data that you want to update?

  const deleteComment = async (comment: CommentWithAuthor): Promise<void> => {
    const mutator = (existingComments: CommentWithAuthor[] | undefined) => {
      if (!existingComments) {
        return [];
      }

      return existingComments.filter((c) => c.id !== comment.id);
    };

    // Optimistically update and remove the comment
    void mutate(['comments', comment.project_id], mutator, {
      revalidate: false,
    });
    void mutate(['comments', comment.project_id, true], mutator, {
      revalidate: false,
    });
    void mutate(['comments', comment.project_id, false], mutator, {
      revalidate: false,
    });

    // Delete the comment and any children
    const { error } = await supabase
      .from('comments')
      .delete()
      .or(`id.eq.${comment.id},parent_id.eq.${comment.id}`);

    if (error) {
      console.error(error);
    }

    // Rollback if the update fails or revalidate to ensure the local and remote states are synced
    void mutate(['comments', comment.project_id]);
    void mutate(['comments', comment.project_id, true]);
    void mutate(['comments', comment.project_id, false]);
  };

  // Marks a comment as unresolved/resolved then invalidates the cache and fetches the updated data
  const markAs = useCallback(
    async (comment: CommentWithAuthor, resolved: boolean): Promise<void> => {
      const mutator = (existingComments: CommentWithAuthor[] | undefined) => {
        if (!existingComments) {
          return [];
        }
        return existingComments.map((c) =>
          c.id === comment.id || c.parent_id === comment.id
            ? { ...c, resolved }
            : c
        );
      };

      // Optimistically update the comment as resolved/unresolved and don't revalidate (call remote) yet§
      // Update the comments for the current page
      void mutate(['comments', comment.project_id], mutator, {
        revalidate: false,
      });
      // Update unresolved comments
      void mutate(['comments', comment.project_id, false], mutator, {
        revalidate: false,
      });
      // Update resolved comments
      void mutate(['comments', comment.project_id, true], mutator, {
        revalidate: false,
      });

      // Perform the actual update
      const { error } = await supabase
        .from('comments')
        .update({ resolved })
        .or(`id.eq.${comment.id},parent_id.eq.${comment.id}`);

      if (error) {
        console.error(error);
      }

      // Rollback if the update fails or revalidate to ensure the local and remote states are synced
      void mutate(['comments', comment.project_id]);
      void mutate(['comments', comment.project_id, false]);
      void mutate(['comments', comment.project_id, true]);
    },
    [supabase]
  );

  return {
    markAs,
    deleteComment,
  };
}
