import { cn } from '@repo/tailwind-config/utils.ts';
import React, { useEffect, useState } from 'react';

interface InboxPopoverProps extends React.ComponentPropsWithoutRef<'div'> {
  onClose?: () => void;
  controlledState?: boolean;
}

const InboxPopover = React.forwardRef<HTMLDivElement, InboxPopoverProps>(
  ({ className, controlledState = false, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(controlledState);

    useEffect(() => {
      setIsOpen(controlledState);
    }, [controlledState]);

    return (
      <div
        className={cn(
          'fixed bottom-4 top-4 z-[999] w-96 transform rounded-md border bg-background shadow-lg transition-all duration-200',
          'data-[state=open]:right-4  data-[state=open]:opacity-100',
          'data-[state=closed]:right-[-24rem]  data-[state=closed]:opacity-0',
          className
        )}
        data-state={isOpen ? 'open' : 'closed'}
        ref={ref}
        {...props}
      />
    );
  }
);

InboxPopover.displayName = 'InboxPopover';

export { InboxPopover };
