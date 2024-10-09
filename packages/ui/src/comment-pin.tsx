'use client';

import { cn } from '@repo/tailwind-config/utils.ts';
import { ComponentPropsWithoutRef, useEffect, useState } from 'react';
import { CommentWithAuthor } from './lib/api/comments';

interface CommentPinProps extends ComponentPropsWithoutRef<'div'> {
  comment: CommentWithAuthor;
}

const CommentPin = ({
  className,
  comment,
  ...props
}: CommentPinProps): JSX.Element | null => {
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

  return (
    <div
      className={cn(
        'fixed flex h-8 w-8 items-center justify-center rounded-bl-full rounded-br-full rounded-tl-none rounded-tr-full bg-white shadow-xl',
        className
      )}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      {...props}
    >
      <div className="bg-white-radial-gradient h-7 w-7 rounded-bl-full rounded-br-full rounded-tl-none rounded-tr-full border-[1.5px] border-black bg-tertiary"></div>
    </div>
  );
};

export { CommentPin };
