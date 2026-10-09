import Link from 'next/link';
import { CreditCard, Star } from 'lucide-react';
import { PricingCard } from '@/features/billing/components/price-card';
import { ProductWithPrices, Price } from '@/features/billing/types';
import { Card } from './card';

interface SubscriptionCardProps {
  subscription: any;
  userProduct?: ProductWithPrices;
  userPrice?: Price;
}

export function YourPlanCard({ subscription, userProduct, userPrice }: SubscriptionCardProps) {
  return (
    <Card
      icon={<CreditCard className='w-5 h-5 text-[#BF8811]' />}
      title='Your Plan 🌟'
      footer={
        subscription ? (
          <Link
            href='/manage-subscription'
            className='inline-flex px-6 py-2.5 bg-white/15 hover:bg-white/10  text-white/90 text-sm  font-bold rounded-lg transition duration-200'
          >
            Manage subscription
          </Link>
        ) : (
          <Link
            href='/pricing'
            className='inline-flex px-6 py-2.5   bg-white/15 hover:bg-white/10  text-white/90 text-sm font-bold rounded-lg  transition duration-200'
          >
            Start a subscription ✨
          </Link>
        )
      }
    >
      {userProduct && userPrice ? (
        <div className='space-y-6'>
          <PricingCard price={userPrice} />
        </div>
      ) : (
        <div className='text-center py-8'>
          <Star className='w-12 h-12 text-white/90  mx-auto mb-4' />
          <p className='text-white/90 mb-2 text-balance'>No active subscription</p>
          <p className='text-sm text-white/60'>Choose a plan to unlock all features</p>
        </div>
      )}
    </Card>
  );
}
