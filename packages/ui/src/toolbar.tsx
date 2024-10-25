'use client';

import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { MessageCircle, Inbox } from 'lucide-react';
import { cn } from '@repo/tailwind-config/utils.ts';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ToggleGroupItem } from './toggle';
import cursorImage from './assets/add-comment-cursor.svg';
import { NewCommentPopover } from './new-comment-popover';
import { InboxPopover } from './inbox-popover';
import useSWR from 'swr';
import { useSupabase } from './providers/supabase-provider';
import { getComments, getCommentsForPage } from './lib/api/comments';
import { CommentPin } from './comment-pin';
import type { CommentWithAuthor } from './types/database.types';
import * as Popover from '@radix-ui/react-popover';

interface ToolbarProps extends React.ComponentPropsWithoutRef<'div'> {}

const Toolbar = ({ className }: ToolbarProps): JSX.Element => {
  //Toggle menu state
  const [menuValue, setMenuValue] = useState<string>('empty');

  //Comment "inspector mode" state
  const isCommenting = menuValue === 'comment';
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({});
  const overlayRef = useRef<HTMLDivElement>(null);

  // Reference to this toolbar widget to prevent highlighting
  const toolbarRef = useRef<HTMLDivElement>(null);

  // New comment state
  const [isAddingComment, setIsAddingComment] = useState<boolean>(false);
  const [newCommentPopoverStyle, setNewCommentPopoverStyle] =
    useState<React.CSSProperties>({});
  const newCommentPopoverRef = useRef<HTMLDivElement>(null);
  const [selectedElement, setSelectedElement] = useState<
    HTMLElement | undefined
  >();

  const { supabase, projectId } = useSupabase();

  // Fetch unresolved comments for this project
  const {
    data: comments,
    error,
    isLoading,
  } = useSWR<CommentWithAuthor[], Error>(
    // List the dependencies as the cache key
    ['comments', projectId],
    // Pass the fetcher with arguments
    () => getCommentsForPage(supabase, projectId, '/')
  );

  if (error) {
    //TODO: Show toast on error
    console.error(error);
  }

  useEffect(() => {
    if (isCommenting) {
      const handleMouseMove = (event: MouseEvent): void => {
        const { clientX, clientY } = event;
        const element = document.elementFromPoint(
          clientX,
          clientY
        ) as HTMLElement | null;
        if (element && overlayRef.current && toolbarRef.current) {
          // Exclude the overlay element itself or the toolbar (and it's children)
          if (
            element === overlayRef.current ||
            toolbarRef.current.contains(element)
          ) {
            return;
          }
          const rect = element.getBoundingClientRect();

          //Move the overlay to the bounding box of the closest element
          setOverlayStyle({
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
          });
        }
      };

      // Get the element under the cursor when the user clicks
      const handleClick = (event: MouseEvent): void => {
        event.preventDefault();
        event.stopPropagation();
        const { clientX, clientY } = event;
        const element = document.elementFromPoint(
          clientX,
          clientY
        ) as HTMLElement | null;
        // Exclude the overlay element itself or the toolbar (and it's children)
        if (
          element &&
          element !== overlayRef.current &&
          !toolbarRef.current?.contains(element)
        ) {
          // Set selected element and show the popover
          setSelectedElement(element);
          setIsAddingComment(true);
        }
        // Close the menu
        setMenuValue('empty');
      };

      // Shortcut to close the menu when "ESC" is pressed
      const handleKeyDown = (event: KeyboardEvent): void => {
        if (event.key === 'Escape') {
          // Close the menu
          setMenuValue('empty');
        }
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('click', handleClick, true);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('click', handleClick, true);
        document.removeEventListener('keydown', handleKeyDown);
        setOverlayStyle({});
      };
    }
  }, [isCommenting]);

  // When `isCommenting` is true swap regular cursor with the "new comment" cursor and set the
  // hit point to its center
  useEffect(() => {
    let styleElement: HTMLStyleElement | null = null;

    if (isCommenting) {
      // Create a style element
      styleElement = document.createElement('style');
      styleElement.type = 'text/css';

      // Define the CSS rule that sets the cursor for all elements
      // This means that other elements cannot override this global CSS rule (i.e. a link or button)
      styleElement.innerHTML = `
        * {
          cursor: url(${cursorImage.src}), auto !important;
        }
      `;

      // Append the style element to the document head
      document.head.appendChild(styleElement);
    }

    return () => {
      // Remove the style element when isCommenting is false or on unmount
      if (styleElement && document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, [isCommenting]);

  // We need to use a useLayoutEffect after the new comment popover has been rendered to the DOM
  // otherwise `newCommentPopoverRef.current` will be null
  // This hook will run synchronously after all DOM mutations but *before the browser repaints*
  // more info: https://react.dev/reference/react/useLayoutEffect
  useLayoutEffect(() => {
    // Get the centre point of the clicked element and place the top left point of the
    // popover at this centre point
    // If there is no room (renders outside the page width) then place top right point instead
    if (isAddingComment && selectedElement && newCommentPopoverRef.current) {
      const popover = newCommentPopoverRef.current;
      const popoverRect = popover.getBoundingClientRect();
      const popoverWidth = popoverRect.width;
      const popoverHeight = popoverRect.height;

      const selectedElementRect = selectedElement.getBoundingClientRect();

      const centerX = selectedElementRect.left + selectedElementRect.width / 2;
      const centerY = selectedElementRect.top + selectedElementRect.height / 2;

      let popoverLeft = centerX;
      let popoverTop = centerY;

      // Adjust positions if popover goes beyond the window width
      if (popoverLeft + popoverWidth > window.innerWidth) {
        // Place top-right corner at the center point
        popoverLeft = centerX - popoverWidth;
      }

      // Adjust positions if popover goes beyond the window height
      if (popoverTop + popoverHeight > window.innerHeight) {
        popoverTop = centerY - popoverHeight;
      }

      // Set the style
      setNewCommentPopoverStyle({
        top: `${popoverTop}px`,
        left: `${popoverLeft}px`,
      });
    }
  }, [isAddingComment, selectedElement]);

  return (
    <>
      <div
        className={cn(
          'absolute bottom-4 left-1/2 flex -translate-x-1/2 transform flex-col items-center justify-center space-y-2',
          className
        )}
        ref={toolbarRef}
      >
        <div
          className={cn(
            'rounded-md border-[0.5px] bg-primary p-1 px-2 shadow-sm animate-in fade-in-0 zoom-in-95 data-[state=closed]:hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'
          )}
          data-state={isCommenting ? 'open' : 'closed'}
        >
          <p className={cn('text-sm text-primary-foreground')}>
            Press{' '}
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border-[0.5px] bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              ESC
            </kbd>{' '}
            to dismiss.
          </p>
        </div>

        <div
          className={cn(
            'flex items-center space-x-1 rounded-md border bg-background p-1 shadow-sm'
          )}
        >
          <ToggleGroup.Root
            disabled={isCommenting}
            onValueChange={(newValue) => {
              setMenuValue(newValue);
            }}
            type="single"
            value={menuValue}
          >
            <ToggleGroupItem value="comment" variant="default">
              <MessageCircle className="h-5 w-5" />
            </ToggleGroupItem>

            <ToggleGroupItem value="inbox" variant="default">
              <Inbox className="h-5 w-5" />
            </ToggleGroupItem>
          </ToggleGroup.Root>
        </div>
      </div>
      {/* TODO: Use a provider or simple state management for menu state? */}
      {/* The bounding box that is overlaid on hovered elements when isCommenting is true */}
      {isCommenting ? (
        <div
          className="pointer-events-none fixed z-[9999] border-2 border-tertiary bg-tertiary/20"
          ref={overlayRef}
          style={overlayStyle}
        />
      ) : null}
      {/* The new comment popover shown only when the user clicks on an element when isCommenting is true */}
      {isAddingComment ? (
        <NewCommentPopover
          onClose={() => {
            setIsAddingComment(false);
          }}
          ref={newCommentPopoverRef}
          selectedElement={selectedElement}
          style={newCommentPopoverStyle}
        />
      ) : null}
      {/* The comment inbox popover that is revealed from the right */}
      <InboxPopover
        controlledState={menuValue === 'inbox'}
        onClose={() => {
          setMenuValue('empty');
        }}
      />
      {/* Plot all unresolved comments on the screen */}
      {comments?.map((comment) => {
        return <CommentPin comment={comment} key={comment.id} />;
      })}
    </>
  );
};

export { Toolbar };
