'use client';

import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { MessageCircle, Inbox } from 'lucide-react';
import { cn } from '@repo/tailwind-config/utils.ts';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Toggle, ToggleGroupItem } from './toggle';

interface ToolbarProps extends React.ComponentPropsWithoutRef<'div'> {}

const Toolbar = ({ className }: ToolbarProps): JSX.Element => {
  //Toggle menu state
  const [menuValue, setMenuValue] = useState<string>('empty');

  //Comment "inspector mode" state
  const isCommenting = useMemo(() => {
    return menuValue === 'comment';
  }, [menuValue]);
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({});
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isCommenting) {
      const handleMouseMove = (event: MouseEvent) => {
        const { clientX, clientY } = event;
        const element = document.elementFromPoint(
          clientX,
          clientY
        ) as HTMLElement | null;
        if (element && overlayRef.current) {
          // Exclude the overlay element itself
          if (element === overlayRef.current) {
            return;
          }
          const rect = element.getBoundingClientRect();
          setOverlayStyle({
            position: 'fixed',
            top: rect.top + 'px',
            left: rect.left + 'px',
            width: rect.width + 'px',
            height: rect.height + 'px',
            border: '2px solid blue',
            backgroundColor: 'rgba(0, 0, 255, 0.1)',
            pointerEvents: 'none',
            zIndex: 9999,
          });
        }
      };

      const handleClick = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        const { clientX, clientY } = event;
        const element = document.elementFromPoint(
          clientX,
          clientY
        ) as HTMLElement | null;
        if (element && element !== overlayRef.current) {
          // Handle the selected element as needed
          console.log('Selected element:', element);
        }
        // Close the menu
        setMenuValue('empty');
      };

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
        <p className="text-red-500">Menu value: {menuValue}</p>
      </div>
      {isCommenting && <div ref={overlayRef} style={overlayStyle} />}
    </>
  );
};

export { Toolbar };
