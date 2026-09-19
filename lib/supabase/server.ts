import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';
import { getSupabaseUrl, getSupabaseAnonKey } from './env';

export async function createServerClient() {
  let cookieStore: { getAll: () => { name: string; value: string }[]; set?: (name: string, value: string, options: CookieOptions) => void };
  try {
    cookieStore = await cookies();
  } catch {
    cookieStore = {
      getAll: () => [],
      set: () => {},
    };
  }

  return createSupabaseServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return typeof cookieStore.getAll === 'function' ? cookieStore.getAll() : [];
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              if (cookieStore && typeof cookieStore.set === 'function') {
                cookieStore.set(name, value, options);
              }
            });
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  );
}
