import type { PostgrestError } from '@supabase/supabase-js';
import type { MergeDeep } from 'type-fest';
import type { Database as DatabaseGenerated } from './database-generated.types';

export type { Json } from './database-generated.types';

// Override generated types
export type Database = MergeDeep<
  DatabaseGenerated,
  {
    public: {
      Views: {
        comments_with_author: {
          Row: {
            id: string;
            project_id: string;
            author_first_name: string;
            author_last_name: string;
            created_at: string;
            resolved: boolean;
            coordinates: string;
            element_xpath: string;
          };
        };
      };
    };
  }
>;

// Generic helpers and shorthands

export type Table<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TableInserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row'];

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];

export type DbResult<T> = T extends PromiseLike<infer U> ? U : never;
export type DbResultOk<T> =
  T extends PromiseLike<{ data: infer U }> ? Exclude<U, null> : never;
export type DbResultErr = PostgrestError;

// Plinth specific types related to the tables, views .. etc
export type CommentWithAuthor = Views<'comments_with_author'>;
export type NewComment = TableInserts<'comments'>;
export type ThreadedComment = Views<'comments_threaded'>;
export type Comment = Table<"comments">;
