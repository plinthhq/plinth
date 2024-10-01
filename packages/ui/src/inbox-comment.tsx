import { cn } from '@repo/tailwind-config/utils.ts';
import { CircleCheck, EllipsisVertical } from 'lucide-react';
import { Skeleton } from './skeleton';
import type { Views } from './types/database.types';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Button } from './button';
import { timeAgo, toInitials } from './lib';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { useSupabase } from './providers/supabase-provider';

type CommentWithAuthor = Views<'comments_with_author'>;

interface InboxCommentProps extends React.ComponentPropsWithoutRef<'div'> {
  isLoading?: boolean;
  comment?: CommentWithAuthor;
}

const InboxComment = ({
  className,
  isLoading = true,
  comment,
  ...props
}: InboxCommentProps): JSX.Element => {
  const { supabase } = useSupabase();

  const markAs = async (resolved: boolean): Promise<void> => {
    if (!comment) {
      return;
    }
    const { error } = await supabase
      .from('comments')
      .update({ resolved })
      .eq('id', comment.id);
    if (error) {
      console.error(error);
    }
  };

  const deleteComment = async (): Promise<void> => {
    if (!comment) {
      return;
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', comment.id);

    if (error) {
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className={cn('flex flex-col gap-4', className)} {...props}>
        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-8" />
        </div>
        <Skeleton className="h-16 w-full" />
        <div className="h-[1px] w-full bg-muted" />
      </div>
    );
  }

  if (!comment) {
    throw new Error(
      'You must provide a comment instance when isLoading is false. `comment` should not be null or undefined when `isLoading` is false.'
    );
  }

  return (
    <div className={cn('flex flex-col gap-4', className)} {...props}>
      <div className="flex justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            {comment.author_avatar_url ? (
              <AvatarImage src={comment.author_avatar_url} />
            ) : null}
            <AvatarFallback>
              {toInitials(comment.author_first_name, comment.author_last_name)}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm">
            {comment.author_first_name} {comment.author_last_name}
          </p>
          <p className="text-sm text-foreground/70">
            {timeAgo(comment.created_at)}
          </p>
        </div>
        {comment.resolved ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="text-foreground/50"
                size="icon"
                variant="ghost"
              >
                <EllipsisVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="z-[99999]">
              <DropdownMenuItem
                onClick={() => {
                  void markAs(false);
                }}
              >
                Mark as unresolved
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  void deleteComment();
                }}
              >
                Permanently delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            className="text-foreground/50 hover:bg-green-50 hover:text-green-500"
            onClick={() => {
              void markAs(true);
            }}
            size="icon"
            variant="ghost"
          >
            <CircleCheck className="h-5 w-5" strokeWidth={1.5} />
          </Button>
        )}
      </div>
      <p className="text-[15px]">{comment.body}</p>
      <div className="h-[1px] w-full bg-muted" />
    </div>
  );
};

export { InboxComment };
