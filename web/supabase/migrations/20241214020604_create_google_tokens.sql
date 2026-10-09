/**
* USER_GOOGLE_TOKENS
* Note: This table stores Google OAuth tokens for users.
* Each record represents a user's Google authentication credentials.
*/
create extension if not exists moddatetime;
create table user_google_tokens (
  -- UUID from auth.users
  id uuid references auth.users(id) on delete cascade primary key,
  -- User's Google email
  email text,
  -- Google OAuth access token
  g_provider_token text not null,
  -- Google OAuth refresh token for getting new access tokens
  g_provider_refresh_token text not null,
  -- Timestamps for record tracking
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Create trigger for updated_at timestamp
create trigger handle_updated_at_user_google_tokens
  before update on user_google_tokens
  for each row
  execute procedure moddatetime(updated_at);
/**
 * REALTIME SUBSCRIPTIONS
 * Add google tokens table to realtime publication
 */
drop publication if exists supabase_realtime;
create publication supabase_realtime for table 
  products,
  prices,
  inboxclarity_newsletter_queue,
  inboxclarity_user_newsletters,
  user_google_tokens;