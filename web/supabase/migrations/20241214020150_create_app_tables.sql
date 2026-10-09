/**
* INBOXCLARITY_NEWSLETTER_QUEUE
* Note: This table stores generated newsletters and their delivery status.
* Each record represents a newsletter to be sent to a user.
*/
create table inboxclarity_newsletter_queue (
  -- Unique identifier for the newsletter entry
  id uuid default gen_random_uuid() primary key,
  -- Reference to the user this newsletter is for
  user_id uuid references auth.users(id),
  -- Email address to send the newsletter to
  email text not null,
  -- The newsletter content in JSON format
  content jsonb not null,
  -- When the newsletter should be sent
  scheduled_send_time timestamp with time zone not null,
  -- Current status of the newsletter delivery
  status text not null check (status in ('generated', 'sending', 'sent', 'failed')),
  -- Number of attempted sends
  attempt_count integer default 0,
  -- When the last send attempt was made
  last_attempt_time timestamp with time zone,
  -- Timestamps for record tracking
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- Create indexes for performance
create index idx_inboxclarity_newsletter_queue_pending 
  on inboxclarity_newsletter_queue(status, scheduled_send_time) 
  where status in ('generated', 'failed');

create index idx_inboxclarity_newsletter_queue_user 
  on inboxclarity_newsletter_queue(user_id, status);

/**
* INBOXCLARITY_USER_NEWSLETTERS
* Note: This table stores user newsletter preferences including timezone and delivery time.
* Each user can have only one newsletter preference record.
*/
create table inboxclarity_user_newsletters (
  -- UUID from auth.users
  user_id uuid references auth.users(id) on delete cascade primary key,
  -- Email address for newsletter delivery
  email text not null,
  -- User's timezone for delivery timing
  timezone text not null default 'UTC',
  -- Hour of the day (in user's timezone) to deliver newsletter
  preferred_hour integer not null default 8 check (preferred_hour >= 0 and preferred_hour < 24),
  -- Whether the user is currently subscribed
  is_subscribed boolean not null default true,
  -- Timestamps for record tracking
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for active subscriptions
create index idx_inboxclarity_newsletter_active_subs 
  on inboxclarity_user_newsletters(timezone, preferred_hour) 
  where is_subscribed = true;

-- Create extension for updating timestamps if not exists
create extension if not exists moddatetime schema extensions;

-- Add triggers for updated_at timestamp
create trigger handle_updated_at_inboxclarity_newsletter_queue
  before update on inboxclarity_newsletter_queue
  for each row
  execute procedure moddatetime(updated_at);

create trigger handle_updated_at_inboxclarity_user_newsletters
  before update on inboxclarity_user_newsletters
  for each row
  execute procedure moddatetime(updated_at);


-- /**
-- * GET_USER_PRODUCT_METADATA
-- * Note: This function retrieves the product metadata for a user's active subscription.
-- * Returns NULL if no active subscription is found.
-- */
-- create or replace function get_user_product_metadata(input_user_id uuid)
-- returns jsonb
-- language sql
-- security definer
-- set search_path = public
-- stable
-- as $$
--     select p.metadata
--     from subscriptions s
--     join prices pr on s.price_id = pr.id
--     join products p on pr.product_id = p.id
--     where s.user_id = input_user_id
--     and s.status = 'active'
--     limit 1;
-- $$;


/**
* GET_USERS_FOR_SCHEDULING
* Note: This function retrieves users who should receive newsletters within the specified
* lookahead window based on their preferred delivery time in their local timezone.
*/
CREATE OR REPLACE FUNCTION inboxclarity_get_users_for_scheduling(lookahead_minutes INT)
RETURNS TABLE (
   user_id UUID,
   email TEXT,
   timezone TEXT,
   preferred_hour INT,
   is_subscribed BOOLEAN, 
   g_provider_token TEXT,
   g_provider_refresh_token TEXT,
   created_at TIMESTAMP WITH TIME ZONE, 
   updated_at TIMESTAMP WITH TIME ZONE  
) AS $$
BEGIN
   RETURN QUERY
   SELECT 
       un.user_id, 
       un.email, 
       un.timezone, 
       un.preferred_hour,
       un.is_subscribed,
       ugt.g_provider_token,
       ugt.g_provider_refresh_token,
       ugt.created_at,
       ugt.updated_at
   FROM inboxclarity_user_newsletters un
   JOIN user_google_tokens ugt ON un.user_id = ugt.id
   WHERE
       un.is_subscribed = true
       AND
       CASE 
           WHEN EXTRACT(HOUR FROM NOW() AT TIME ZONE un.timezone) < un.preferred_hour THEN
               (date_trunc('day', NOW() AT TIME ZONE un.timezone) + 
               (un.preferred_hour * interval '1 hour'))::timestamp AT TIME ZONE un.timezone
           ELSE
               (date_trunc('day', NOW() AT TIME ZONE un.timezone + interval '1 day') + 
               (un.preferred_hour * interval '1 hour'))::timestamp AT TIME ZONE un.timezone
       END AT TIME ZONE 'UTC'
       BETWEEN 
           NOW()
           AND 
           NOW() + (lookahead_minutes * interval '1 minute');
END;
$$ LANGUAGE plpgsql;

/**
 * REALTIME SUBSCRIPTIONS
 * Add newsletter tables to realtime publication
 */
drop publication if exists supabase_realtime;
create publication supabase_realtime for table 
  products,
  prices,
  inboxclarity_newsletter_queue,
  inboxclarity_user_newsletters;