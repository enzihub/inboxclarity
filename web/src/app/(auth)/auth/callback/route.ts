import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendBriefNow } from '@/shared/services/brief';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectTo = searchParams.get('redirect_to') ?? '/dashboard';
  const timezone = searchParams.get('timezone') ?? 'UTC';

  if (code) {
    const supabase = createClient();

    try {
      const { data: session, error }: any = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Error exchanging code for session:', error.message, error.details);
        return NextResponse.redirect(`${process.env.SITE_URL}/auth/auth-code-error`);
      }

      const userId = session.session.user.id;
      const providerToken = session.session.provider_token;
      const providerRefreshToken = session.session.provider_refresh_token;
      const email = session.session.user.email;

      // // Check user subscription status
      // const { data: subscription } = await supabase
      //   .from('subscriptions')
      //   .select('*, prices(*, products(*))')
      //   .in('status', ['trialing', 'active'])
      //   .eq('user_id', userId)
      //   .maybeSingle();

      const userRow = {
        id: userId,
        full_name: session.user.user_metadata.full_name ?? '',
        avatar_url: session.user.user_metadata.avatar_url ?? '',
        // Add other fields if required, ensure no null/undefined values for NOT NULL fields
      };

      // Fetch the existing user data first
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (fetchError) {
        return NextResponse.redirect(`${process.env.SITE_URL}/auth/auth-code-error`);
      }

      // Merge existing data with the new data (avoid overwriting existing non-null values)
      const mergedUserRow = {
        ...existingUser, // existing data
        ...userRow, // new data
      };

      // Perform upsert
      const { error: userUpsertError } = await supabase
        .from('users')
        .upsert(mergedUserRow);

      if (userUpsertError) {
        return NextResponse.redirect(`${process.env.SITE_URL}/auth/auth-code-error`);
      }

      const row = {
        id: userId,
        email,
        g_provider_token: providerToken,
        g_provider_refresh_token: providerRefreshToken,
      };
      const { error: upsertError } = await supabase.from('user_google_tokens').upsert(row);
      if (upsertError) {
        return NextResponse.redirect(`${process.env.SITE_URL}/auth/auth-code-error`);
      }

      // Check if user already has newsletter preferences
      const { data: existingNewsletter } = await supabase
        .from('inboxclarity_user_newsletters')
        .select('preferred_hour')
        .eq('user_id', userId)
        .single();

      // Only set newsletter preferences if user doesn't exist
      if (!existingNewsletter) {
        const newsletterRow = {
          user_id: userId,
          email,
          preferred_hour: 7,
          timezone,
          is_subscribed: true,
        };
        const { error: newsletterError } = await supabase.from('inboxclarity_user_newsletters').insert(newsletterRow);

        if (newsletterError) {
          return NextResponse.redirect(`${process.env.SITE_URL}/auth/auth-code-error`);
        }
      }

      // Redirect to pricing if no active subscription
      // if (!subscription) {
      //   return NextResponse.redirect(`${process.env.SITE_URL}/pricing`);
      // }
      // return NextResponse.redirect(`${process.env.SITE_URL}${next}`);

      // Send the first brief straight away
      try {
        // Custom API URL (if needed)
        await sendBriefNow(supabase, userId, email!, {
          apiUrl: process.env.CORE_API_URL,
        });
      } catch (newsletterError) {
        console.error('Failed to send newsletter but continuing auth flow:', newsletterError);
        // Continue with auth flow even if newsletter fails
      }

      // // Redirect to dashboard on login
      // return NextResponse.redirect(`${process.env.SITE_URL}/dashboard`);
      return NextResponse.redirect(`${process.env.SITE_URL}${redirectTo}`);
    } catch (error: any) {
      console.error('Unexpected error:', error.message);
      return NextResponse.redirect(`${process.env.SITE_URL}/auth/auth-code-error`);
    }
  } else {
    console.log('No code provided, redirecting to error page.');
    return NextResponse.redirect(`${process.env.SITE_URL}/auth/auth-code-error`);
  }
}
