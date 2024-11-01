import { mutate } from 'swr';
import { useCallback } from 'react';
import type {
  Comment,
  CommentWithAuthor,
  NewComment,
} from '../../types/database.types';
import { useSupabase } from '../../providers/supabase-provider';

export function useComment(): {
  markAs: (comment: CommentWithAuthor, resolved: boolean) => Promise<void>;
  deleteComment: (comment: CommentWithAuthor) => Promise<void>;
  updateComment: (
    previous: Comment,
    updated: Partial<Comment>
  ) => Promise<Comment | null>;
  createComment: (comment: NewComment) => Promise<Comment | null>;
} {
  const { supabase, projectId } = useSupabase();

  const createComment = async (
    comment: NewComment
  ): Promise<Comment | null> => {
    const { data, error } = await supabase
      .from('comments')
      .insert(comment)
      .select()
      .returns<Comment[]>();
    // Invalidate data (on success) or fallback (on error)
    if (error) {
      console.error(error);
      throw new Error(error.message);
    }

    // Invalidate the comments for this project and page
    void mutate(['comments', projectId]);
    // Invalidate the comments in the inbox, a new unresolved comment has been created
    void mutate(['comments', projectId, false]);
    // Invalidate the thread (when the new comment is a reply)
    void mutate(['thread', data[0].parent_id]);

    return data[0];
  };

  const updateComment = async (
    previous: Comment,
    updated: Partial<Comment>
  ): Promise<Comment | null> => {
    const { data, error } = await supabase
      .from('comments')
      .update(updated)
      .eq('id', previous.id)
      .select()
      .returns<Comment[]>();

    if (error) {
      throw new Error(error.message);
    }

    return data[0];
  };

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
    // Update the thread too
    void mutate(['thread', comment.parent_id], mutator, { revalidate: false });

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
    // Update the thread too
    void mutate(['thread', comment.parent_id]);
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
    updateComment,
    createComment,
  };
}
