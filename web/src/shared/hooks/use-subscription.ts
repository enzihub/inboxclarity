// hooks/use-subscription.ts
import { useEffect, useState } from 'react';
import { useUser } from './use-user';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export type Price = {
  id: string;
  product_id: string;
  active: boolean;
  description: string;
  unit_amount: number;
  currency: string;
  type: string;
  interval: string | null;
  interval_count: number | null;
  trial_period_days: number | null;
  metadata: Record<string, any>;
  products: Product;
};

export type Product = {
  id: string;
  active: boolean;
  name: string;
  description: string | null;
  image: string | null;
  metadata: Record<string, any>;
};

export type Subscription = {
  id: string;
  user_id: string;
  status: 'trialing' | 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid' | 'paused';
  metadata: Record<string, any>;
  price_id: string;
  quantity: number;
  cancel_at_period_end: boolean;
  created: string;
  current_period_start: string;
  current_period_end: string;
  ended_at: string | null;
  cancel_at: string | null;
  canceled_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
  prices: Price;
};

export function useSubscription(productName: string = 'InboxClarity') {
  const { user } = useUser();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!user) {
      setSubscriptions([]);
      setLoading(false);
      return;
    }

    async function fetchSubscriptions(user: User) {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*, prices(*, products(*))')
          .eq('user_id', user.id)
          .in('status', ['trialing', 'active']);

        if (error) throw error;

        // Filter for specific product after getting the data
        const appSubscriptions = data?.filter((sub) => sub.prices?.products?.name === productName) || [];
        setSubscriptions(appSubscriptions);
      } catch (err) {
        console.error('Error fetching subscriptions:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch subscriptions'));
      } finally {
        setLoading(false);
      }
    }

    fetchSubscriptions(user);
  }, [user, supabase, productName]);

  // Get the most recent subscription
  const subscription =
    subscriptions.length > 0
      ? subscriptions.reduce((latest, current) => {
          return new Date(current.created) > new Date(latest.created) ? current : latest;
        }, subscriptions[0])
      : null;

  const isSubscribed = subscription?.status === 'active' || subscription?.status === 'trialing';
  const isTrialing = subscription?.status === 'trialing';
  const isPastDue = subscription?.status === 'past_due';
  const isCanceled = subscription?.status === 'canceled';

  const daysUntilTrialEnds = subscription?.trial_end
    ? Math.ceil((new Date(subscription.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const daysUntilRenewal = subscription?.current_period_end
    ? Math.ceil((new Date(subscription.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    subscription, // Most recent subscription
    subscriptions, // All subscriptions
    loading,
    error,
    isSubscribed,
    isTrialing,
    isPastDue,
    isCanceled,
    daysUntilTrialEnds,
    daysUntilRenewal,
  };
}
