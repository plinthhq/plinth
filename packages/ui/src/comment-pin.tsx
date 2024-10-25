'use client';

import { cn } from '@repo/tailwind-config/utils.ts';
import type { ComponentPropsWithoutRef } from 'react';
import { useEffect, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { CircleCheck, Send } from 'lucide-react';
import useSWR, { mutate } from 'swr';
import type { CommentWithAuthor, NewComment } from './types/database.types';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { timeAgo, toInitials } from './lib/utils';
import { Button } from './button';
import { getCommentsInThread, markAs } from './lib/api/comments';
import { useSupabase } from './providers/supabase-provider';
import { Textarea } from './textarea';
import { Label } from './label';

interface CommentPinProps extends ComponentPropsWithoutRef<'button'> {
  comment: CommentWithAuthor;
}

const CommentPin = ({
  className,
  comment,
  ...props
}: CommentPinProps): JSX.Element | null => {
  const { supabase, session } = useSupabase();

  // Fetch any replies to the comment (the thread)
  const { data: replies, error } = useSWR<CommentWithAuthor[], Error>(
    // List the dependencies as the cache key
    ['thread', comment.id],
    // Pass the fetcher with arguments
    () => getCommentsInThread(supabase, comment.id)
  );

  if (error) {
    //TODO: Show toast on error
    console.error(error);
  }

  const hasReplies = (replies?.length ?? 0) > 0;

  const [replyText, setReplyText] = useState<string>('');

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

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setReplyText(e.target.value);
  };

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    await createComment();
    setReplyText('');
  };

  const createComment = async (): Promise<void> => {
    if (!session) {
      console.error(
        'Session object is null. Please ensure the user is signed in.'
      );
      return;
    }

    // const { right: x, top: y } = selectedElement.getBoundingClientRect();
    const newComment: NewComment = {
      body: replyText,
      parent_id: comment.id,
      project_id: comment.project_id,
      author_id: session.user.id,
      page_url: `${window.location.pathname}${window.location.search}`,
      element_xpath: comment.element_xpath,
      coordinates: comment.coordinates,
    };
    const { error: creationError } = await supabase
      .from('comments')
      .insert(newComment);
    // Invalidate data (on success) or fallback (on error)
    if (creationError) {
      console.error(creationError);
    }
    void mutate(['thread', comment.id]);
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
        <div className="flex flex-col gap-4 p-4">
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
            <Button
              className="text-foreground/50 hover:bg-green-50 hover:text-green-500"
              onClick={() => {
                void markAs(supabase, comment, true, [
                  'comments',
                  comment.project_id,
                ]);
              }}
              size="icon"
              variant="ghost"
            >
              <CircleCheck className="h-5 w-5" strokeWidth={1.5} />
            </Button>
          </div>
          <p className="text-[15px]">{comment.body}</p>
        </div>

        {/* Render replies to the comment */}
        {hasReplies ? (
          <>
            <div className="h-[1px] w-full bg-border" />

            <div className="flex flex-col gap-4 p-4">
              {replies?.map((reply) => (
                <div className="flex flex-col gap-4" key={reply.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      {reply.author_avatar_url ? (
                        <AvatarImage src={reply.author_avatar_url} />
                      ) : null}
                      <AvatarFallback>
                        {toInitials(
                          reply.author_first_name,
                          reply.author_last_name
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm">
                      {reply.author_first_name} {reply.author_last_name}
                    </p>
                    <p className="text-sm text-foreground/70">
                      {timeAgo(reply.created_at)}
                    </p>
                  </div>
                  <p className="text-[15px]">{reply.body}</p>
                </div>
              ))}
            </div>
          </>
        ) : null}

        <div className="h-[1px] w-full bg-border" />

        {/* Render the reply text area */}
        <form
          className="overflow-hidden p-4 focus-within:ring-1 focus-within:ring-ring"
          onSubmit={(e: React.FormEvent) => {
            void handleSubmit(e);
          }}
        >
          <Label className="sr-only" htmlFor="reply">
            Reply
          </Label>
          <Textarea
            className="min-h-0 resize-none border-none p-0 shadow-none focus-visible:ring-0"
            id="reply"
            onChange={handleChange}
            placeholder="Reply here..."
            value={replyText}
          />
          <div className="flex items-center">
            {/* TODO: Tooltips buttons for attaching files or screenshots */}
            {/* <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Paperclip className="size-4" />
                <span className="sr-only">Attach file</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Attach File</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Mic className="size-4" />
                <span className="sr-only">Use Microphone</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Use Microphone</TooltipContent>
          </Tooltip> */}
            <Button
              className="ml-auto"
              size="icon"
              type="submit"
              variant="ghost"
            >
              <Send className="h-5 w-5" strokeWidth={2} />
            </Button>
          </div>
        </form>
      </Popover.Content>
    </Popover.Root>
  );
};

export { CommentPin };