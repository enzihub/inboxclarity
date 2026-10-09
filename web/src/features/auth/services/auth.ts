// services/auth/auth.ts

import { createClient } from '@/lib/supabase/client';
import { getUserTimezone } from '@/shared/services/timezone';

const supabase = createClient();

export const handleGoogleAuth = async () => {
  try {
    // Get timezone before redirect
    const timezone = getUserTimezone();
    const next = new URLSearchParams(window.location.search).get('next') ?? '/dashboard';

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?timezone=${encodeURIComponent(timezone)}&redirect_to=${encodeURIComponent(next)}`,
        // scopes: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl email profile openid',
        scopes: 'email profile openid https://www.googleapis.com/auth/gmail.readonly',
        // scopes: 'email profile openid',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
  } catch (error) {
    console.error('Error:', error);
    alert('Something went wrong with Google sign-in. Please try again.');
  }
};
