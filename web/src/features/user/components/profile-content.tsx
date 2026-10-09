'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/shared/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import { ProductWithPrices, Price } from '@/features/billing/types';
import { YourPlanCard } from './your-plan-card';
import { AccountActionsCard } from './account-actions-card';
import { NewsletterCard } from './newsletter-card';
import { ProfileDetailsCard } from './profile-details-card';
import { NeedAssistance } from './need-assistance';

interface ProfileContentProps {
  session: any;
  subscription: any;
  products: ProductWithPrices[];
}

export function ProfileContent({ session, subscription, products }: ProfileContentProps) {
  const { user, loading } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const [preferredHour, setPreferredHour] = useState(8);

  useEffect(() => {
    async function fetchPreferredHour() {
      if (!user) return;

      try {
        const { data, error } = await supabase.from('inboxclarity_user_newsletters').select('preferred_hour').eq('user_id', user?.id).single();

        if (error) throw error;
        if (data) setPreferredHour(data.preferred_hour);
      } catch (error) {
        console.error('Error fetching preferred hour:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPreferredHour();
  }, [user, supabase]);

  if (loading) {
    return (
      <div className='flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  if (!user) return null;

  let userProduct: ProductWithPrices | undefined;
  let userPrice: Price | undefined;

  if (subscription) {
    for (const product of products) {
      for (const price of product.prices) {
        if (price.id === subscription.price_id) {
          userProduct = product;
          userPrice = price;
        }
      }
    }
  }

  return (
      <div className='mx-auto'>
        <div className='text-center space-y-4 max-w-4xl mx-auto px-8'>
          {/* <span className='inline-block px-4 py-1 rounded-full bg-gray-100 text-sm font-medium text-gray-900'>Profile</span> */}
          <h1 className='text-6xl tracking-tight text-white/90'>Welcome, {user.user_metadata.full_name.split(' ')[0] || 'User'} 👋</h1>
          <h1 className='text-6xl tracking-tight text-white/90'>Customize your preferences</h1>
          <p className='text-white/60 text-xl px-16 py-4 my-3'>Take control of your preferences to enjoy personalized
            summaries, delivered exactly how you like them.</p>
        </div>

        <div className='grid md:grid-cols-2 gap-4 py-16'>
          <ProfileDetailsCard user={user}/>
          <NewsletterCard user={user} isLoading={isLoading} preferredHour={preferredHour}
                          setPreferredHour={setPreferredHour}/>
          <div className='md:col-span-2'>
            <YourPlanCard subscription={subscription} userProduct={userProduct} userPrice={userPrice}/>
          </div>
          <div className='md:col-span-2'>
            <AccountActionsCard user={user}/>
          </div>
        </div>
        <NeedAssistance/>
      </div>
  );
}
