'use client';

import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { MessageCircle, Inbox } from 'lucide-react';
import { cn } from '@repo/tailwind-config/utils.ts';
import { useEffect, useRef, useState } from 'react';
import { ToggleGroupItem } from './toggle';

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

  return (
    <>
      <div
        className={cn(
          'absolute bottom-4 left-1/2 flex -translate-x-1/2 transform items-center space-x-1 rounded-md border bg-background p-1 shadow-sm',
          className
        )}
        ref={toolbarRef}
      >
        <ToggleGroup.Root
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
