'use client';

import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { MessageCircle, Inbox } from 'lucide-react';
import { cn } from '@repo/tailwind-config/utils.ts';
import { useEffect, useRef, useState } from 'react';
import { ToggleGroupItem } from './toggle';
import cursorImage from './assets/add-comment-cursor.svg';

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

  useEffect(() => {
    if (isCommenting) {
      const handleMouseMove = (event: MouseEvent) => {
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
      const handleClick = (event: MouseEvent) => {
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
          // Handle the selected element as needed
          console.log('Selected element:', element);
        }
        // Close the menu
        setMenuValue('empty');
      };

      // Shortcut to close the menu when "ESC" is pressed
      const handleKeyDown = (event: KeyboardEvent) => {
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
      {isCommenting && (
        <div
          className="border-tertiary bg-tertiary/20 pointer-events-none fixed z-[9999] border-2"
          ref={overlayRef}
          style={overlayStyle}
        />
      )}
    </>
  );
};

export { Toolbar };
