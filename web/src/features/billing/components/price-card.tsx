// pricing-card.tsx

'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { BillingInterval, Price } from '../types';

export function PricingCard({ price, createCheckoutAction }: { price: Price; createCheckoutAction?: ({ price }: { price: Price }) => void }) {
  const isFree = price.unit_amount === 0;
  const isPopular = !isFree && price.interval === 'year';
  const priceAmount = (price.unit_amount || 0) / 100;

  return (
    <div
      className={`
        relative h-full flex flex-col rounded-xl bg-black overflow-visible transition-all duration-200
      `}
    >
      {/* {isPopular && (
        <div className='absolute -top-4 left-1/2 -translate-x-1/2 z-10'>
          <span className='bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium shadow-sm whitespace-nowrap'>Most Popular</span>
        </div>
      )} */}
      <div className='p-6 flex flex-col flex-1'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h3 className='text-xl font-semibold text-white/90'>{isFree ? 'Free' : 'Paid'}</h3>
          <div className='mt-4 flex items-baseline justify-center gap-x-2'>
            <span className='text-5xl font-bold text-white/90'>${priceAmount}</span>
            {!isFree && <span className='text-lg text-white/60'>/{price.interval}</span>}
          </div>
        </div>

        {/* Description */}
        <div className='min-w-3xl mx-auto mb-8 text-lg text-white/60 py-6 text-center'>
          {isFree ? <div>Perfect for getting started with InboxClarity</div> : <div>Get access to all InboxClarity premium features</div>}
        </div>

        {/* Features List */}
        <div className='flex-1'>
          <ul className='space-y-4 mb-8'>
            {isFree ? (
              <li className='flex items-start gap-3 text-lg text-white/60'>
                <CheckCircle2 className='h-5 w-5 text-[#BF8811] mt-0.5 flex-shrink-0' />
                Basic features
              </li>
            ) : (
              <li className='flex items-start gap-3 text-lg text-white/60'>
                <CheckCircle2 className='h-5 w-5 text-[#BF8811] mt-0.5 flex-shrink-0' />
                All premium features
              </li>
            )}
          </ul>
        </div>

        {/* CTA Button */}
        <div className='mt-auto'>
          {createCheckoutAction && (
            <button
              onClick={() => createCheckoutAction({ price })}
              className={`
                w-full px-4 py-2.5 rounded-lg font-medium transition-colors
                ${isPopular ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-white text-gray-900 border border-gray-200 hover:border-blue-500'}
              `}
            >
              {isFree ? 'Get started for free' : 'Upgrade now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
