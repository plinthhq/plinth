'use client';

import { useState } from 'react';
import { useComment } from '../lib/hooks/use-comment';
import type { CommentWithAuthor, NewComment } from '../types/database.types';
import { Textarea } from '../textarea';
import { Label } from '../label';
import { Button } from '../button';
import { Send } from 'lucide-react';

interface AddReplyProps {
  comment: CommentWithAuthor;
  authorId: string;
}

export const AddReply = ({ comment, authorId }: AddReplyProps): JSX.Element => {
  const { createComment } = useComment();
  const [replyText, setReplyText] = useState<string>('');
  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    const newComment: NewComment = {
      body: replyText,
      parent_id: comment.id,
      project_id: comment.project_id,
      author_id: authorId,
      page_url: `${window.location.pathname}${window.location.search}`,
      element_xpath: comment.element_xpath,
      coordinates: comment.coordinates,
    };

    await createComment(newComment);
    setReplyText('');
  };

  return (
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
        onChange={(event) => {
          setReplyText(event.target.value);
        }}
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
        <Button className="ml-auto" size="icon" type="submit" variant="ghost">
          <Send className="h-5 w-5" strokeWidth={2} />
        </Button>
      </div>
    </form>
  );
};
