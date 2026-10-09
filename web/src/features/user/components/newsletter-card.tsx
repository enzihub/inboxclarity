// newsletter-card.tsx

import { Clock } from 'lucide-react';
import { getUserTimezone } from '@/shared/services/timezone';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { getNextOccurrence } from '../utils/date-utils';
import { sendBriefNow } from '@/shared/services/brief';
import { createClient } from '@/lib/supabase/client';

export function NewsletterCard({ user, isLoading, preferredHour, setPreferredHour }: any) {
  const [timezone] = useState(getUserTimezone());
  const [nextEmailTime, setNextEmailTime] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const supabase = createClient();

  const AUTHORIZED_EMAILS = process.env.NEXT_PUBLIC_AUTHORIZED_EMAILS?.split(',') || [];

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const { data, error } = await supabase.from('inboxclarity_user_newsletters').select('is_subscribed').eq('user_id', user.id).single();

      if (error) throw error;
      setIsSubscribed(data?.is_subscribed ?? false);
    } catch (err) {
      console.error('Error fetching subscription status:', err);
    }
  };

  const handleToggleSubscription = async () => {
    setToggleLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('inboxclarity_user_newsletters')
        .update({
          is_subscribed: !isSubscribed,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setIsSubscribed(!isSubscribed);
      alert(isSubscribed ? 'Successfully unsubscribed!' : 'Successfully subscribed!');
    } catch (err) {
      console.error('Error toggling subscription:', err);
      alert('Failed to update subscription status. Please try again.');
    } finally {
      setToggleLoading(false);
    }
  };

  const handleSend = async () => {
    try {
      await sendBriefNow(supabase, user.id, user.email!);
      alert('InboxClarity requested successfully. Check your email shortly!');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to send InboxClarity. Please try again.');
    }
  };

  const handleUpdatePreferences = async () => {
    setUpdating(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_CORE_API_URL}/users/${user.id}/newsletter-preferences`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferred_hour: preferredHour,
          timezone: timezone,
        }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        const nextEmail = getNextOccurrence(result.data.preferred_hour, result.data.timezone);
        setNextEmailTime(nextEmail);
        alert(`Preferences updated! Your next email will arrive on ${nextEmail}`);
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      alert('Failed to update preferences. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return {
      value: hour,
      label: `${hour12}:00 ${ampm}`,
    };
  });

  return (
    <div className='rounded-xl p-6 '>
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-3'>
          <Clock className='w-5 h-5 text-[#BF8811]' />
          <h2 className='text-lg font-medium text-white/90'>Newsletter ✉️</h2>
        </div>
        <button
          onClick={handleToggleSubscription}
          disabled={toggleLoading}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition duration-200
            ${isSubscribed ? 'bg-white/15 text-[#17999B]' : 'text-gray-900 font-bold bg-[#BF8811] '}`}
        >
          {toggleLoading ? '...' : isSubscribed ? 'Unsubscribe' : 'Subscribe'}
        </button>
      </div>
      {isSubscribed && (
        <div className='space-y-4'>
          <div>
            <div className='flex flex-wrap items-center gap-3 text-white/60'>
              <span className='text-base'>I want my newsletter at</span>
              {isLoading ? (
                <Skeleton className='h-9 w-24' />
              ) : (
                <select
                  value={preferredHour}
                  onChange={(e) => setPreferredHour(parseInt(e.target.value))}
                  className=' border-none px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-950 text-white/90   focus:outline-none focus:ring-2 focus:ring-[#BF8811] focus:ring-opacity-10'
                >
                  {hours.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <p className='text-sm text-white/60 mt-2 mb-2'>({timezone})</p>
          </div>
          {nextEmailTime && (
            <div className='text-sm font-semibold text-[#BF8811] rounded-lg p-3'>
              Perfect! 🎉 Your next curated recommendations will arrive on {nextEmailTime}
            </div>
          )}

          <button
            onClick={handleUpdatePreferences}
            disabled={updating}
            className='w-full font-medium bg-white/15 text-white/90 py-3 px-4 rounded-lg  hover:bg-white/10 transition duration-200  text-sm '
          >
            {updating ? 'Saving...' : 'Save My Preference'}
          </button>

          {AUTHORIZED_EMAILS.includes(user.email!) && (
            <button
              onClick={handleSend}
              className='w-full flex items-center justify-center gap-2 py-2 px-4 text-sm text-[#BF8811] hover:bg-blue-50 font-medium rounded-lg transition duration-200'
            >
              Send me InboxClarity Now! ✨
            </button>
          )}
        </div>
      )}

      {!isSubscribed && <p className='text-white/60 text-sm'>Subscribe to receive curated recommendations in your inbox at your preferred time.</p>}
    </div>
  );
}
