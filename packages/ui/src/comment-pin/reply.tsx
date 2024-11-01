'use client';

import { EllipsisVertical } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@repo/tailwind-config/utils.ts';
import { Avatar, AvatarFallback, AvatarImage } from '../avatar';
import { Button } from '../button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../dropdown-menu';
import { timeAgo, toInitials } from '../lib/utils';
import type { Comment, CommentWithAuthor } from '../types/database.types';
import { useComment } from '../lib/hooks/use-comment';
import { Textarea } from '../textarea';

interface ReplyProps extends React.ComponentPropsWithoutRef<'form'> {
  reply: CommentWithAuthor;
}
export const Reply = ({ reply }: ReplyProps): JSX.Element => {
  const [isEditing, setIsEditing] = useState(false);
  const [replyText, setReplyText] = useState(reply.body);
  const { deleteComment, updateComment } = useComment();

  const editComment = (): void => {
    setIsEditing((prev) => !prev);
  };

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    try {
      await updateComment(reply as Comment, { body: replyText });
    } catch (updateError) {
      //TODO: Toast
      console.error(updateError);
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            {reply.author_avatar_url ? (
              <AvatarImage src={reply.author_avatar_url} />
            ) : null}
            <AvatarFallback>
              {toInitials(reply.author_first_name, reply.author_last_name)}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm">
            {reply.author_first_name} {reply.author_last_name}
          </p>
          <p className="text-sm text-foreground/70">
            {timeAgo(reply.created_at)}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="text-foreground/50" size="icon" variant="ghost">
              <EllipsisVertical className="h-5 w-5" strokeWidth={1.5} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="z-[99999]">
            <DropdownMenuItem
              onClick={() => {
                editComment();
              }}
            >
              Edit comment
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                void deleteComment(reply);
              }}
            >
              Permanently delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* <p className="text-[15px]">{reply.body}</p> */}
      <Textarea
        className="min-h-5 resize-none border-0 p-0 shadow-none focus-visible:ring-0 disabled:cursor-default disabled:opacity-100"
        disabled={!isEditing}
        id="comment"
        onChange={(event) => {
          setReplyText(event.target.value);
        }}
        placeholder="Type your reply here..."
        value={replyText}
      />
      {isEditing ? (
        <div className="flex items-center p-3 pt-0">
          {/* TODO: Tooltips buttons for attaching files or screenshots, see Shadcn examples */}
          <Button
            className={cn('ml-auto gap-1.5')}
            disabled={!isEditing}
            size="sm"
            type="submit"
          >
            Send Message
          </Button>
        </div>
      ) : null}
    </form>
  );
};
