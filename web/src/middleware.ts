// src/middleware.ts

import { type NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

// The below are the routes that should be protected with auth
export const config = {
  matcher: ['/protected', '/dashboard', '/pricing', '/settings', '/admin/:path*'],
};

