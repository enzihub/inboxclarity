// lib/supabase/middleware.ts

import { getSubscription } from '@/features/user/controllers/get-subscription';
import { getUserRole } from '@/shared/utils/get-user-role';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Create a Supabase client
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
      },
    },
  });

  // Get the current user from Supabase
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get the user's role using the custom getUserRole function
  const role = await getUserRole();

  // If user is trying to access pricing page, check their subscription status
  if (request.nextUrl.pathname.startsWith('/pricing')) {
    // If not authenticated, allow access to pricing page
    if (!user) {
      return NextResponse.next();
    }

    // Get subscription for user for product
    const subscription = await getSubscription();

    // If user has an active subscription, redirect to manage-subscription
    if (subscription?.status === 'active') {
      const url = request.nextUrl.clone();
      url.pathname = '/manage-subscription';
      return NextResponse.redirect(url);
    }

    // If authenticated but no active subscription, allow access to pricing
    return NextResponse.next();
  }

  // If user is trying to access dashboard page, check their subscription status
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // If not authenticated, redirect to sign-in page
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // Get subscription for user for product
    const subscription = await getSubscription();

    if (subscription?.status !== 'active' && subscription?.status !== 'trialing') {
      const url = request.nextUrl.clone();
      url.pathname = '/pricing';
      return NextResponse.redirect(url);
    }

    // If authenticated but active subscription, allow access to dashboard
    return NextResponse.next();
  }

  // Redirect non-admin users trying to access admin pages to the home page
  if (user && role !== 'admin' && request.nextUrl.pathname.startsWith('/admin')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Redirect unauthenticated users to sign-in page
  if (!user && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/auth')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users attempting to access the sign-in page to the home page
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
