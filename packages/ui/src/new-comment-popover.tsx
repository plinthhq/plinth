'use client';

import { cn } from '@repo/tailwind-config/utils.ts';
import React, { useEffect, useImperativeHandle, useRef } from 'react';
import { Label } from './label';
import { Textarea } from './textarea';
import { Button } from './button';

interface NewCommentPopoverProps extends React.ComponentPropsWithoutRef<'div'> {
  onClose: () => void;
}

const NewCommentPopover = React.forwardRef<
  HTMLDivElement,
  NewCommentPopoverProps
>(({ className, onClose, ...props }, ref) => {
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

  return (
    <div
      className={cn('fixed z-[9999] w-96', className)}
      ref={localRef}
      {...props}
    >
      <form className="relative overflow-hidden rounded-lg border bg-background shadow-lg focus-within:ring-1 focus-within:ring-ring">
        <Label className="sr-only" htmlFor="message">
          Message
        </Label>
        <Textarea
          className="min-h-12 resize-none border-0 p-3 shadow-none focus-visible:ring-0"
          id="message"
          placeholder="Type your message here..."
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
