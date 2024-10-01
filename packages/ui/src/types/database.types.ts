import type { PostgrestError } from '@supabase/supabase-js';
import type { MergeDeep } from 'type-fest';
import type { Database as DatabaseGenerated } from './database-generated.types';

export type { Json } from './database-generated.types';

export type Database = MergeDeep<
  DatabaseGenerated,
  {
    public: {
      Views: {
        comments_with_author: {
          Row: {
            id: string;
            author_first_name: string;
            author_last_name: string;
            created_at: string;
            resolved: boolean;
          };
        };
      };
    };
  }
>;

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
