'use client';

import { cn } from '@repo/tailwind-config/utils.ts';
import type { ComponentPropsWithoutRef } from 'react';
import { useEffect, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { CircleCheck, EllipsisVertical } from 'lucide-react';
import type { Comment, CommentWithAuthor } from '../types/database.types';
import { Avatar, AvatarFallback, AvatarImage } from '../avatar';
import { timeAgo, toInitials } from '../lib/utils';
import { Button } from '../button';
import { useSupabase } from '../providers/supabase-provider';
import { Textarea } from '../textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../dropdown-menu';
import { useThread } from '../lib/hooks/use-thread';
import { useComment } from '../lib/hooks/use-comment';
import { Reply } from './reply';
import { AddReply } from './add-reply';

interface CommentPinProps extends ComponentPropsWithoutRef<'button'> {
  comment: CommentWithAuthor;
}

const CommentPin = ({
  className,
  comment,
  ...props
}: CommentPinProps): JSX.Element | null => {
  const { session } = useSupabase();
  if (!session) {
    throw Error('Session object is null. Please ensure the user is signed in.');
  }

  // Fetch any replies to the comment (the thread)
  const { data: replies, error } = useThread(comment.id);
  const { markAs, deleteComment, updateComment } = useComment();

  // Comment editing state to toggle the form
  const [isEditing, setIsEditing] = useState(false);

  if (error) {
    //TODO: Show toast on error
    console.error(error);
  }

  const [commentText, setCommentText] = useState(comment.body);

  const hasReplies = (replies?.length ?? 0) > 0;

  // The XPath of the element in question
  const xpath = comment.element_xpath;

  // State to hold the position of the comment relative to the element
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null
  );

  // Helper function to find the element using the XPath
  const getElementByXPath = (path: string): HTMLElement | null => {
    const result = document.evaluate(
      path,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    return result.singleNodeValue as HTMLElement | null;
  };

  useEffect(() => {
    const element = getElementByXPath(xpath);

    if (element) {
      // Get the bounding rectangle of the element
      const rect = element.getBoundingClientRect();

      // Set the position of the comment relative to the target element
      setPosition({ x: rect.right, y: rect.top });
    } else {
      console.error('Element not found for the given XPath:', xpath);
    }

    const handleResize = () => {
      if (element) {
        const rect = element.getBoundingClientRect();
        setPosition({ x: rect.right, y: rect.top });
      }
    };

    // Add event listener to handle window resizing
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [xpath]);

  if (!position) {
    // If the element or position is not yet found, return nothing
    return null;
  }

  const editComment = (): void => {
    setIsEditing((prev) => !prev);
  };

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    try {
      await updateComment(comment as Comment, { body: commentText });
    } catch (updateError) {
      //TODO: Toast
      console.error(updateError);
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          className={cn(
            'fixed z-[500] flex h-8 w-8 items-center justify-center rounded-bl-full rounded-br-full rounded-tl-none rounded-tr-full bg-white shadow-xl',
            className
          )}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            // FIXME: When I uncomment the style below no background colour is applied
            // I think this is to do with Tailwind preflight
            // Adding a prefix and renaming the CSS variables may fix this?
            backgroundColor: 'white',
          }}
          type="button"
          {...props}
        >
          <div className="h-7 w-7 rounded-bl-full rounded-br-full rounded-tl-none rounded-tr-full border-[1.5px] border-black bg-tertiary bg-white-radial-gradient"></div>
        </button>
      </Popover.Trigger>
      <Popover.Content
        align="start"
        className={cn(
          'z-[500] flex min-w-80 flex-col overflow-hidden rounded border bg-white shadow-xl'
          // { 'rounded-b-none': hasReplies }
        )}
        side="right"
        sideOffset={8}
      >
        {/* Render the comment */}
        <form
          className="flex flex-col gap-4 p-4"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                {comment.author_avatar_url ? (
                  <AvatarImage src={comment.author_avatar_url} />
                ) : null}
                <AvatarFallback>
                  {toInitials(
                    comment.author_first_name,
                    comment.author_last_name
                  )}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm">
                {comment.author_first_name} {comment.author_last_name}
              </p>
              <p className="text-sm text-foreground/70">
                {timeAgo(comment.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-0">
              <Button
                className="text-foreground/50 hover:bg-green-50 hover:text-green-500"
                onClick={() => {
                  void markAs(comment, true);
                }}
                size="icon"
                variant="ghost"
              >
                <CircleCheck className="h-5 w-5" strokeWidth={1.5} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="text-foreground/50"
                    size="icon"
                    variant="ghost"
                  >
                    <EllipsisVertical className="h-5 w-5" strokeWidth={1.5} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="z-[99999]">
                  {/* TODO: Add edit logic */}
                  <DropdownMenuItem
                    onClick={() => {
                      editComment();
                    }}
                  >
                    Edit comment
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      void deleteComment(comment);
                    }}
                  >
                    Permanently delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <Textarea
            className="resize-none border-0 p-0 shadow-none focus-visible:ring-0 disabled:cursor-default disabled:opacity-100"
            disabled={!isEditing}
            id="comment"
            onChange={(event) => {
              setCommentText(event.target.value);
            }}
            placeholder="Type your message here..."
            value={commentText}
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

        {/* Render replies to the comment */}
        {hasReplies ? (
          <>
            <div className="h-[1px] w-full bg-border" />
            <div className="flex flex-col gap-4 p-4">
              {replies?.map((reply) => <Reply key={reply.id} reply={reply} />)}
            </div>
          </>
        ) : null}

        <div className="h-[1px] w-full bg-border" />

        {/* Render the reply text area */}
        <AddReply authorId={session.user.id} comment={comment} />
      </Popover.Content>
    </Popover.Root>
  );
};

export { CommentPin };
