'use server';

import { redirect } from 'next/navigation';
import { getSession } from '../../user/controllers/get-session';
import { getOrCreateCustomer } from '../../user/controllers/get-or-create-customer';
import { Price } from '../types';
import { stripeAdmin } from '@/lib/stripe/stripe-admin';
import { getURL } from '@/shared/utils/get-url';

export async function createCheckoutAction({ price }: { price: Price }) {
  // 1. Get the user from session
  // const session = await getSession();

  // if (!session?.user) {
  //   return redirect(`${getURL()}/signup`);
  // }
  //
  // if (!session.user.email) {
  //   throw Error('Could not get email');
  // }

  // 2. Retrieve or create the customer in Stripe
  // const customer = await getOrCreateCustomer({
  //   userId: session.user.id,
  //   email: session.user.email,
  // });

  // 2.a. Check for existing subscription and throw error with billing portal URL if exists
  // if (price.type === 'recurring') {
  //   // const existingSubscriptions = await stripeAdmin.subscriptions.list({
  //   //   customer,
  //   //   status: 'active',
  //   //   expand: ['data.items.data.price'],
  //   // });
  //
  //   // const hasSubscription = existingSubscriptions.data.some((subscription) => {
  //   //   return subscription.items.data.some((item) => {
  //   //     const priceData = item.price as { product: string };
  //   //     return priceData.product === price.product_id;
  //   //   });
  //   // });
  //
  //   // if (hasSubscription) {
  //   //   const { url } = await stripeAdmin.billingPortal.sessions.create({
  //   //     customer,
  //   //     return_url: `${getURL()}/dashboard`,
  //   //   });
  //   //
  //   //   // TODO: This redirect causes a weird glich when developer tools are open.
  //   //   return redirect(url);
  //   // }
  // }

  // 3. Create a checkout session in Stripe
  const checkoutSession = await stripeAdmin.checkout.sessions.create({
    payment_method_collection: 'if_required',
    payment_method_types: ['card'],
    billing_address_collection: 'auto',
    // customer,
    // customer_update: {
    //   address: 'auto',
    // },
    line_items: [
      {
        price: price.id,
        quantity: 1,
      },
    ],
    mode: price.type === 'recurring' ? 'subscription' : 'payment',
    allow_promotion_codes: true,
    success_url: `${getURL()}/dashboard`,
    cancel_url: `${getURL()}/`,
    metadata: {
      app_code: 'inboxclarity',
    },
    subscription_data: {
      metadata: {
        app_code: 'inboxclarity',
      },
    },
  });

  if (!checkoutSession || !checkoutSession.url) {
    throw Error('checkoutSession is not defined');
  }

  // 4. Redirect to checkout url
  redirect(checkoutSession.url);
}
