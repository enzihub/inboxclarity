import { createClient } from '@/lib/supabase/server';

export async function getSubscription() {
  const supabase = createClient();

  // Get the current user's ID from auth session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, prices(*, products(*))')
    // .eq('user_id', user.id)
      .eq('email', user.email)
    .in('status', ['trialing', 'active']);

  if (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }

  // Filter for specific product name
  const appSubscription = data?.find((sub) => sub.prices?.products?.name === 'InboxClarity') || null;

  return appSubscription;
}
