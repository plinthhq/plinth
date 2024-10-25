'use client';

import { cn } from '@repo/tailwind-config/utils.ts';
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Label } from './label';
import { Textarea } from './textarea';
import { Button } from './button';
import { useSupabase } from './providers/supabase-provider';
import getXPath from './lib/utils/get-xpath';
import { mutate } from 'swr';
import type { NewComment } from './types/database.types';

interface NewCommentPopoverProps extends React.ComponentPropsWithoutRef<'div'> {
  onClose: () => void;
  selectedElement?: HTMLElement;
}

const NewCommentPopover = React.forwardRef<
  HTMLDivElement,
  NewCommentPopoverProps
>(({ className, onClose, selectedElement, ...props }, ref) => {
  const { supabase, projectId, session } = useSupabase();
  const [commentText, setCommentText] = useState<string>('');

  // Create a local ref
  const localRef = useRef<HTMLDivElement>(null);

  // Expose the local ref to the parent component
  useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(
    ref,
    () => localRef.current
  );

  // Close popover when clicking or focusing outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        localRef.current &&
        !localRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleFocusOutside = (event: FocusEvent) => {
      if (
        localRef.current &&
        !localRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('focusin', handleFocusOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('focusin', handleFocusOutside);
    };
  }, [onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setCommentText(e.target.value);
  };

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    await createComment();
    setCommentText('');
    onClose();
  };

  const createComment = async (): Promise<void> => {
    if (!session) {
      console.error(
        'Session object is null. Please ensure the user is signed in.'
      );
      return;
    }
    if (!selectedElement) {
      console.error('No selected element was passed to NewCommentPopover.');
      return;
    }
    const { right: x, top: y } = selectedElement.getBoundingClientRect();
    const newComment: NewComment = {
      body: commentText,
      project_id: projectId,
      author_id: session.user.id,
      page_url: `${window.location.pathname}${window.location.search}`,
      element_xpath: getXPath(selectedElement),
      coordinates: `${x},${y}`,
    };
    const { error } = await supabase.from('comments').insert(newComment);
    // Invalidate data (on success) or fallback (on error)
    if (error) {
      console.error(error);
    }
    void mutate(['comments', projectId]);
  };

  return (
    <div
      className={cn('fixed z-[9999] w-96', className)}
      ref={localRef}
      {...props}
    >
      <form
        className="relative overflow-hidden rounded-lg border bg-background shadow-lg focus-within:ring-1 focus-within:ring-ring"
        onSubmit={(e: React.FormEvent) => {
          void handleSubmit(e);
        }}
      >
        <Label className="sr-only" htmlFor="message">
          Message
        </Label>
        <Textarea
          className="min-h-12 resize-none border-0 p-3 shadow-none focus-visible:ring-0"
          id="message"
          onChange={handleChange}
          placeholder="Type your message here..."
          value={commentText}
        />
        <div className="flex items-center p-3 pt-0">
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
          <Button className="ml-auto gap-1.5" size="sm" type="submit">
            Send Message
          </Button>
        </div>
      </form>
    </div>
  );
});

NewCommentPopover.displayName = 'NewCommentPopover';

export { NewCommentPopover };
