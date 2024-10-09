import { cn } from '@repo/tailwind-config/utils.ts';
import type { ComponentPropsWithoutRef } from 'react';
import { forwardRef, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import useSWR from 'swr';
import { useSupabase } from './providers/supabase-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Button } from './button';
import { InboxComment } from './inbox-comment';
import type { CommentWithAuthor } from './types/database.types';
import { getComments } from './lib/api/comments';

interface InboxPopoverProps extends ComponentPropsWithoutRef<'div'> {
  onClose?: () => void;
  controlledState?: boolean;
}

const InboxPopover = forwardRef<HTMLDivElement, InboxPopoverProps>(
  ({ className, onClose, controlledState = false, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(controlledState);
    const { supabase, projectId } = useSupabase();

    const [activeTab, setActiveTab] = useState<string>('inbox');
    const isResolved = activeTab === 'resolved';

    // Fetch data
    const {
      data: comments,
      error,
      isLoading,
    } = useSWR<CommentWithAuthor[], Error>(
      // List the dependencies as the cache key
      ['comments', projectId, isResolved],
      // Pass the fetcher with arguments
      () => getComments(supabase, projectId, isResolved)
    );

    if (error) {
      //TODO: Show toast on error
      console.error(error);
    }

    useEffect(() => {
      setIsOpen(controlledState);
    }, [controlledState]);

    const renderComments = (): JSX.Element => (
      <div className="flex flex-col gap-8 p-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => {
              // eslint-disable-next-line react/no-array-index-key -- There is nothing unique about these elements so we can use the array index here
              return <InboxComment isLoading={isLoading} key={index} />;
            })
          : null}
        {!isLoading &&
          comments?.map((comment, _) => {
            return (
              <InboxComment
                comment={comment}
                isLoading={isLoading}
                key={comment.id}
              />
            );
          })}
      </div>
    );

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
      >
        <Tabs
          className="w-full"
          defaultValue="inbox"
          onValueChange={(newTab) => {
            setActiveTab(newTab);
          }}
          value={activeTab}
        >
          <TabsList className="w-full border-b px-4">
            <TabsTrigger value="inbox">Inbox</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <Button
              className="ml-auto"
              onClick={() => {
                setIsOpen(false);
                onClose?.();
              }}
              size="icon"
              variant="ghost"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </Button>
          </TabsList>
          <TabsContent value="inbox">{renderComments()}</TabsContent>
          <TabsContent value="resolved">{renderComments()}</TabsContent>
        </Tabs>
      </div>
    );
  }
);

InboxPopover.displayName = 'InboxPopover';

export { InboxPopover };
